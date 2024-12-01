import mongoose from "mongoose";

export async function connectDB(uri: string) {
  try {
    await mongoose.connect(uri);
    console.info("Connection to db established successfully!");
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : "An error occurred");
    process.exit(1);
  }
}
