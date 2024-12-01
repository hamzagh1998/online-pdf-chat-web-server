import { Model } from "mongoose";

import { EntityRepository } from "./entity-repository";

import {
  ConversationDocument,
  ConversationModel,
} from "../models/conversation";

class ConversationRepository extends EntityRepository<ConversationDocument> {
  constructor(readonly conversationModel: Model<ConversationDocument>) {
    super(conversationModel);
  }
}

export const conversationRepository = new ConversationRepository(
  ConversationModel
);
