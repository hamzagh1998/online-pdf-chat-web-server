import { Schema, model, Document, Model } from "mongoose";

type User = {
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  photoURL: string;
  createdAt: Date;
  updatedAt: Date | null;
};

type UserDocument = User & Document;

const UserSchema = new Schema<UserDocument>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  photoURL: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    required: true,
    default: "free",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

const UserModel: Model<UserDocument> = model<UserDocument>("User", UserSchema);

export { UserModel, UserDocument };
