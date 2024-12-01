import { Model, Schema, model, Document } from "mongoose";

type Message = {
  conversation: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId;
  content: string;
  isAiResponse: boolean;
  timestamp: Date;
};

type MessageDocument = Message & Document;

const MessageSchema = new Schema<MessageDocument>({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isAiResponse: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const MessageModel: Model<MessageDocument> = model<MessageDocument>(
  "Message",
  MessageSchema
);

export { MessageModel, MessageDocument };
