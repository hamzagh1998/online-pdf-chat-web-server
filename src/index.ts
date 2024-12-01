import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import cors from "@elysiajs/cors";
import admin from "firebase-admin";

import { configuration } from "./config";

import { onFirebaseAuth } from "./hooks/on-firebase-auth";

import { connectDB } from "./db/connect-db";

import { auth } from "./controllers/auth";
import { conversation } from "./controllers/conversation";

const firebaseConfig = configuration.firebaseAppConfig;
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
});

const PORT = process.env.PORT || 4000;
const DB_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_PROD_URL!
    : process.env.MONGO_DEV_URL!;

// Connect to db
await connectDB(DB_URI);

const app = new Elysia()
  .use(cors())
  .use(bearer())
  .onBeforeHandle(onFirebaseAuth) // Check if the user is authenticated from firebase
  .get("/", () => ({
    msg: "Healthy!",
  }))
  .use(auth)
  .use(conversation)
  .listen(PORT);

console.info(
  `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`
);
