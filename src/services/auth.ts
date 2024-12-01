import { ObjectId } from "mongoose";

import { userRepository } from "../db/user-repository";
import { UserDocument } from "../models/user";

import { SignUp, UserData } from "../schemas/auth";

import { Common } from "./common";

import { ReturnType } from "./types";

import { tryToCatch } from "../utils/try-to-catch";
import { ConversationDocument } from "../models/conversation";

export abstract class AuthService extends Common {
  static async signUp({
    firstName,
    lastName,
    email,
    photoURL,
    plan,
  }: SignUp): ReturnType<unknown> {
    const avatar = photoURL
      ? photoURL
      : `https://api.dicebear.com/6.x/initials/svg?radius=50&seed=${firstName} ${lastName}`;

    const [userError, userDoc] = await tryToCatch<UserDocument | null>(() =>
      userRepository.create({
        firstName,
        lastName,
        email,
        photoURL: avatar,
        plan,
      })
    );
    if (userError) {
      console.error("An error occured while getting user data: ", userError);
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    return this.getUserData(userDoc!.email);
  }

  static async getUserData(email: string): ReturnType<UserData | unknown> {
    const [userError, userDoc] = await tryToCatch<UserDocument | null>(
      (email: string) => userRepository.findOne({ email }),
      email
    );
    if (userError) {
      console.error("An error occurred while getting user data: ", userError);
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    if (!userDoc) {
      return { error: true, detail: "User not found!", status: 404 };
    }

    const userFilesData = await this.getUserFileUsageInMB(
      userDoc._id as string
    );

    if (userFilesData.error) {
      return userFilesData;
    }

    const conversationsData = await this.getUserConversations(
      userDoc._id as string
    );

    if (conversationsData.error) {
      return conversationsData;
    }

    const conversationIds = (conversationsData.detail as any)
      .map((conversation: ConversationDocument) => conversation.participants)
      .flat();

    const [participantsError, participants] = await tryToCatch<
      UserDocument[] | null
    >(() =>
      userRepository.find(
        {
          _id: { $in: conversationIds },
        },
        { __v: 0, email: 0, plan: 0, updatedAt: 0 }
      )
    );
    if (participantsError) {
      console.error("Error while fetching participants: ", participantsError);
      return { error: true, detail: "Unexpected error occurred!", status: 500 };
    }

    if (participants) {
      const participantsMap = new Map<string, UserDocument>(
        participants.map((participant) => [
          participant._id!.toString(),
          participant,
        ])
      );

      const conversationsWithParticipants = (
        conversationsData.detail as any
      ).map((conversation: ConversationDocument) => ({
        ...conversation,
        participants: conversation.participants.map((participantId: ObjectId) =>
          participantsMap.get(participantId.toString())
        ),
      }));

      const { _id, ...rest } = userDoc;

      return {
        error: false,
        detail: {
          ...rest,
          id: _id,
          storageUsageInMb: userFilesData.detail,
          conversations: conversationsWithParticipants,
        },
      };
    }

    return { error: true, detail: "Unexpected error occurred!", status: 500 };
  }
}
