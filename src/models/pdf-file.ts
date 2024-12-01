import { Model, Schema, model, Document } from "mongoose";

type PdfFile = {
  name: string;
  url: string;
  owner: Schema.Types.ObjectId;
  sizeInMB: number;
  createdAt: Date;
};

type PdfFileDocument = PdfFile & Document;

const PdfFileSchema = new Schema<PdfFileDocument>({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sizeInMB: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PdfFileModel: Model<PdfFileDocument> = model<PdfFileDocument>(
  "PdfFile",
  PdfFileSchema
);

export { PdfFileModel, PdfFileDocument };
