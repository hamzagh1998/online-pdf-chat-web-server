import { pdfFileRepository } from "../db/pdf-file-repository";
import { userRepository } from "../db/user-repository";

import { PdfFileDocument } from "../models/pdf-file";

import { ReturnType } from "./types";

import { conversationRepository } from "../db/conversation-repository";
import { ConversationDocument } from "../models/conversation";
import { messageRepository } from "../db/message-repository";
import { MessageDocument } from "../models/messages";

import { tryToCatch } from "../utils/try-to-catch";
import { UserDocument } from "../models/user";

export class Common {
  static async isUserExists(email: string) {
    return !!(await userRepository.findOne({ email }));
  }

  static async getUserFileUsageInMB(
    userId: string
  ): ReturnType<number | string> {
    const [pdfFileError, pdfFiledocs] = await tryToCatch<
      PdfFileDocument[] | null
    >((userId: string) => pdfFileRepository.find({ owner: userId }), userId);
    if (pdfFileError) {
      console.error(
        "An error occured while getting user pdf files: ",
        pdfFileError
      );
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    if (!pdfFiledocs || !pdfFiledocs?.length) {
      return { error: false, detail: 0 };
    }
    return {
      error: false,
      detail: pdfFiledocs.reduce((sum, doc) => sum + doc.sizeInMB, 0),
    };
  }

  static async getUserConversations(userId: string) {
    const [error, conversationsDocs] = await tryToCatch<
      ConversationDocument[] | null
    >(
      (userId: string) =>
        conversationRepository.find(
          { participants: { $in: [userId] } },
          { __v: 0 }
        ),
      userId
    );
    if (error) {
      console.error(
        "An error occured while getting user conversations: ",
        error
      );
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    if (!conversationsDocs || !conversationsDocs?.length) {
      return { error: false, detail: [] };
    }

    const conversationsPdfIds = conversationsDocs.map(
      (conversationDoc) => conversationDoc.pdfFile
    );

    const [pdfFilesError, pdfFiles] = await tryToCatch<
      PdfFileDocument[] | null
    >(
      (pdfIds: string[]) => pdfFileRepository.find({ _id: { $in: pdfIds } }),
      conversationsPdfIds
    );

    if (pdfFilesError) {
      console.error(
        "An error occured while getting conversations pdf: ",
        error
      );
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    // Map pdf files to conversations
    const conversationsWithPdfFileURL = conversationsDocs.map(
      (conversationDoc) => {
        const pdfFile = pdfFiles?.find(
          (pdfFile) =>
            pdfFile._id!.toString() === conversationDoc.pdfFile.toString()
        );

        if (pdfFile) {
          return { ...conversationDoc, pdfFileURL: pdfFile.url };
        }
        return conversationDoc;
      }
    );

    return { error: false, detail: conversationsWithPdfFileURL };
  }

  static async getConversation(conversationId: string) {
    const [error, conversationDoc] =
      await tryToCatch<ConversationDocument | null>(
        (conversationId: string) =>
          conversationRepository.findOne({ _id: conversationId }),
        conversationId
      );

    if (error) {
      console.error(error);
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

    const [pdfFileError, pdfFileDoc] = await tryToCatch<PdfFileDocument | null>(
      (pdfFileId: string) => pdfFileRepository.findOne({ _id: pdfFileId }),
      conversationDoc.pdfFile
    );

    if (pdfFileError) {
      console.error(pdfFileError);
      return {
        error: true,
        status: 500,
        detail: "Error while fetching pdf file",
      };
    }

    if (!pdfFileDoc) {
      return {
        error: true,
        status: 404,
        detail: "Pdf file not found",
      };
    }

    const [participantsError, participants] = await tryToCatch<
      UserDocument[] | null
    >(() =>
      userRepository.find(
        { _id: { $in: conversationDoc.participants } },
        { __v: 0, email: 0, plan: 0, updatedAt: 0 }
      )
    );
    if (participantsError) {
      console.error("Error while fetching participants: ", participantsError);
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    return {
      error: false,
      detail: { ...conversationDoc, participants, pdfFileUrl: pdfFileDoc.url },
    };
  }
}
