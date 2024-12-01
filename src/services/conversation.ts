import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ObjectId } from "mongoose";

import { userRepository } from "../db/user-repository";
import { UserDocument } from "../models/user";
import { pdfFileRepository } from "../db/pdf-file-repository";
import { PdfFileDocument } from "../models/pdf-file";
import { conversationRepository } from "../db/conversation-repository";
import { ConversationDocument } from "../models/conversation";
import { MessageDocument } from "../models/messages";
import { messageRepository } from "../db/message-repository";

import { NewConversation } from "../schemas/converstaion";

import { Common } from "./common";

import { configuration } from "../config";

import { tryToCatch } from "../utils/try-to-catch";

const genAI = new GoogleGenerativeAI(configuration.geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const aiResponse = async (prompt: string) => {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text() || "No response content";
  } catch (error) {
    console.error("Error in AI response:", error);
    throw error;
  }
};

export abstract class ConversationService extends Common {
  static async createConversation({
    email,
    fileName,
    fileURL,
    fileSizeInMB,
  }: NewConversation) {
    const [error, userDoc] = await tryToCatch<UserDocument | null>(
      (email: string) => userRepository.findOne({ email }),
      email
    );
    if (error) {
      console.error(error);
      return {
        error: true,
        status: 500,
        detail: "Error while creating conversation",
      };
    }

    if (!userDoc) {
      return {
        error: true,
        status: 404,
        detail: "User not found",
      };
    }

    const [createPdferror, pdfDoc] = await tryToCatch<PdfFileDocument>(() =>
      pdfFileRepository.checkAndCreate(
        { owner: userDoc._id, name: fileName, sizeInMB: fileSizeInMB },
        {
          name: fileName,
          url: fileURL,
          sizeInMB: fileSizeInMB,
          owner: userDoc._id,
        }
      )
    );

    if (createPdferror) {
      console.error(createPdferror);
      return {
        error: true,
        status: 500,
        detail: "Error while creating pdf document",
      };
    }

    const [createConversation, _] = await tryToCatch<ConversationDocument>(() =>
      conversationRepository.checkAndCreate(
        { pdfFile: pdfDoc?._id },
        {
          name: pdfDoc?.name,
          owner: userDoc._id,
          participants: [userDoc._id],
          pdfFile: pdfDoc?._id,
        }
      )
    );

    if (createConversation) {
      console.error(createConversation);
      return {
        error: true,
        status: 500,
        detail: "Error while creating conversation",
      };
    }

    return {
      error: false,
      detail: "Conversation created successfully!",
      status: 201,
    };
  }

  static async getConversationMessages(conversationId: string) {
    const conversationDoc = await this.getConversation(conversationId);

    if (conversationDoc.error) {
      console.error(conversationDoc.error);
      return {
        error: true,
        status: 500,
        detail: "Error while fetching conversation",
      };
    }

    if (!conversationDoc) {
      return {
        error: true,
        status: 404,
        detail: "Conversation not found",
      };
    }

    const [messagesError, messagesDocs] = await tryToCatch<
      MessageDocument[] | null
    >(
      (conversationId: string) =>
        messageRepository.find({ conversation: conversationId }, { __v: 0 }),
      conversationId
    );

    const [error, participants] = await tryToCatch<UserDocument[] | null>(() =>
      userRepository.find(
        { _id: { $in: (conversationDoc.detail as any).participants } },
        { __v: 0, email: 0, plan: 0, updatedAt: 0 }
      )
    );
    if (error) {
      console.error("Error while fetching participants: ", error);
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    if (messagesError) {
      console.error(
        "An error occured while getting conversation messages: ",
        messagesError
      );
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    const messages = messagesDocs!.map((messageDoc) =>
      participants!.find(
        (participant) =>
          (participant._id as any).toString() === messageDoc.sender.toString()
      )
        ? {
            ...messageDoc,
            sender: participants!.find(
              (participant) =>
                (participant._id as any).toString() ===
                messageDoc.sender.toString()
            ),
          }
        : messageDoc
    );

    return {
      error: false,
      status: 200,
      detail: {
        messages,
        participants,
      },
    };
  }

  static async addParticipantToConversation(
    conversationId: string,
    userId: string
  ) {
    const conversationDoc = await this.getConversation(conversationId);

    if (conversationDoc.error) {
      console.error(conversationDoc.error);
      return {
        error: true,
        status: 500,
        detail: "Error while fetching conversation",
      };
    }

    if (!conversationDoc) {
      return {
        error: true,
        status: 404,
        detail: "Conversation not found",
      };
    }

    const [error] = await tryToCatch<ConversationDocument | null>(() =>
      conversationRepository.findOneAndUpdate(
        { _id: conversationId },
        { $addToSet: { participants: userId } }
      )
    );

    if (error) {
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    return {
      error: false,
      status: 203,
      detail: "particpants added successfully",
    };
  }

  static async removeParticipantFromConversation(
    conversationId: string,
    userId: string
  ) {
    const conversationDoc = await this.getConversation(conversationId);

    if (conversationDoc.error) {
      console.error(conversationDoc.error);
      return {
        error: true,
        status: 500,
        detail: "Error while fetching conversation",
      };
    }

    if (!conversationDoc) {
      return {
        error: true,
        status: 404,
        detail: "Conversation not found",
      };
    }

    const [error] = await tryToCatch<ConversationDocument | null>(() =>
      conversationRepository.findOneAndUpdate(
        { _id: conversationId },
        { $pull: { participants: userId } }
      )
    );

    if (error) {
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    return {
      error: false,
      status: 203,
      detail: "particpants removed successfully",
    };
  }

  static async deleteConversation(conversationId: string) {
    const conversationDoc = await this.getConversation(conversationId);
    if (!conversationDoc) {
      return {
        error: true,
        status: 404,
        detail: "Conversation not found",
      };
    }

    const { pdfFile } = conversationDoc.detail as any;
    const [deleteConversationError] = await tryToCatch<boolean>(() =>
      conversationRepository.deleteMany({ _id: { $in: [conversationId] } })
    );
    if (deleteConversationError) {
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    const [deletePdfError] = await tryToCatch<boolean>(() =>
      pdfFileRepository.deleteMany({ _id: { $in: [pdfFile] } })
    );
    if (deletePdfError) {
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    const [deleteMessagesError] = await tryToCatch<boolean>(() =>
      messageRepository.deleteMany({ conversation: conversationId })
    );
    if (deleteMessagesError) {
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }
    return {
      error: false,
      status: 203,
      detail: "Conversation deleted successfully",
    };
  }

  static async sendQuestion(
    conversationId: string,
    userId: string,
    msg: string
  ) {
    const conversationDoc = await this.getConversation(conversationId);

    if (conversationDoc.error) {
      console.error(conversationDoc.error);
      return {
        error: true,
        status: 500,
        detail: "Error while fetching conversation",
      };
    }

    if (!conversationDoc) {
      return {
        error: true,
        status: 404,
        detail: "Conversation not found",
      };
    }

    const pdfFileURL = (conversationDoc.detail as any).pdfFileUrl;

    const parsedPDFText = await this.parsePDF(pdfFileURL);

    //* Save Answer: AI
    const prompt = `Here is the content of the PDF document:\n\n${parsedPDFText}\n\nUser's question: ${msg}`;
    const response = await aiResponse(prompt);
    await messageRepository.create({
      conversation: conversationId,
      sender: userId,
      content: msg,
    });
    await messageRepository.create({
      conversation: conversationId,
      sender: userId,
      content: response,
      isAiResponse: true,
    });
  }

  private static async parsePDF(pdfFileURL: string) {
    try {
      // Fetch the PDF file
      const response = await fetch(pdfFileURL);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      let allText = "";

      // Extract text from each page
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        allText += pageText + `\nPage number ${i}\n`;
      }

      return allText;
    } catch (error) {
      console.error("Error parsing PDF:", error);
      throw error;
    }
  }
}
