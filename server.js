import { createApp } from "./app.mjs";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { SessionStore } from "./config/index.mjs";

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

const PORT = +env.PORT || 8080;

(async function () {
  await mongoose.connect(env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  });
  console.log("Database connection succeeded.");
  const app = createApp(SessionStore);
  app.listen(PORT, function () {
    console.log(
      "Server is running on PORT %d in %s mode.",
      PORT,
      app.get("env")
    );
  });
})();
