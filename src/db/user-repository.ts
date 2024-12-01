import { EntityRepository } from "./entity-repository";

import { Model } from "mongoose";

import { UserModel, UserDocument } from "../models/user";

class UserRepository extends EntityRepository<UserDocument> {
  constructor(readonly userModel: Model<UserDocument>) {
    super(userModel);
  }
}

export const userRepository = new UserRepository(UserModel);
