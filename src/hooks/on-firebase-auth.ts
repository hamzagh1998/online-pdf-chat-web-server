import { StatusMap } from "elysia";
import { HTTPHeaders } from "elysia/dist/types";
import admin from "firebase-admin";

type args = {
  bearer: string | undefined;
  set: {
    headers: HTTPHeaders;
    status?: number | keyof StatusMap;
  };
  headers: Record<string, string | undefined>;
};

export async function onFirebaseAuth({ bearer, headers, set }: args) {
  if (headers.upgrade === "websocket") return; // Skip the authentication for WebSocket connections

  if (!bearer) {
    set.status = 400;
    set.headers[
      "WWW-Authenticate"
    ] = `Bearer realm='sign', error="invalid_request"`;

    return "Unauthorized, User token is missing!";
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(bearer);

    headers["email"] = decodedToken.email
      ? decodedToken.email
      : decodedToken.user_id; // Add the decoded user email/user_id to the request headers
  } catch (error) {
    set.status = 401;
    set.headers[
      "WWW-Authenticate"
    ] = `Bearer realm='sign', error="invalid_token"`;

    return "Unauthorized, User token is invalid!";
  }
}
