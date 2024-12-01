import { Model } from "mongoose";

import { EntityRepository } from "./entity-repository";

import { MessageDocument, MessageModel } from "../models/messages";

class MessageRepository extends EntityRepository<MessageDocument> {
  constructor(readonly messageModel: Model<MessageDocument>) {
    super(messageModel);
  }
}

export const messageRepository = new MessageRepository(MessageModel);
