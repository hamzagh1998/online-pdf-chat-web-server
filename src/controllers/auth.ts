import { Elysia } from "elysia";

import { signupDTO } from "../schemas/auth";

import { AuthService } from "../services/auth";
import { Common } from "../services/common";

export const auth = new Elysia({ prefix: "/auth", name: "auth" })
  .post(
    "/signup",
    async ({ set, body: { email, firstName, lastName, photoURL, plan } }) => {
      const { detail, status } = await AuthService.signUp({
        email,
        firstName,
        lastName,
        photoURL,
        plan,
      });
      set.status = status;
      return detail;
    },
    {
      body: signupDTO, // validate the request body
      beforeHandle: async ({ body, set }) => {
        // check if the user already exists
        if (await Common.isUserExists(body.email)) {
          set.status = 409;
          return { detail: "User already exists" };
        }
      },
    }
  )
  .get("/user-data", async ({ set, headers }) => {
    const result = await AuthService.getUserData(headers["email"] as string);
    if (result.error) {
      set.status = result.status;
    }
    return result.detail;
  });
