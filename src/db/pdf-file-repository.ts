import { Model } from "mongoose";

import { EntityRepository } from "./entity-repository";

import { PdfFileDocument, PdfFileModel } from "../models/pdf-file";

class PdfFileRepository extends EntityRepository<PdfFileDocument> {
  constructor(readonly pdfFileModel: Model<PdfFileDocument>) {
    super(pdfFileModel);
  }
}

export const pdfFileRepository = new PdfFileRepository(PdfFileModel);
