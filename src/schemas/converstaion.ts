import { t } from "elysia";

export const newConversationDTO = t.Object({
  email: t.String(), // if the provider is facebook the email will be uid
  fileName: t.String(),
  fileURL: t.String(),
  fileSizeInMB: t.Number(),
  plan: t.String({ default: "free" }),
});

export type NewConversation = {
  email: string;
  fileName: string;
  fileURL: string;
  fileSizeInMB: number;
};
