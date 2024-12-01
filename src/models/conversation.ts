import { Model, Schema, model, Document } from "mongoose";

type Conversation = {
  name: string;
  owner: Schema.Types.ObjectId;
  participants: Schema.Types.ObjectId[];
  pdfFile: Schema.Types.ObjectId;
  isPublic: boolean;
  isArchived: boolean;
  createdAt: Date;
};

type ConversationDocument = Conversation & Document;

const ConversationSchema = new Schema<ConversationDocument>({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    required: true,
  },
  pdfFile: {
    type: Schema.Types.ObjectId,
    ref: "PdfFile",
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ConversationModel: Model<ConversationDocument> =
  model<ConversationDocument>("Conversation", ConversationSchema);

export { ConversationModel, ConversationDocument };
