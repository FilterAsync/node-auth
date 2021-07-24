import { createApp } from "./app.mjs";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { SessionStore } from "./config/index.mjs";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
  dotenv.config();
}

const PORT = +ENV.PORT || 8080;

(async function () {
  await mongoose.connect(ENV.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  });
  console.log("Database connection succeeded.");
  const server = createApp(SessionStore);
  server.listen(PORT, function () {
    console.log(
      "Server is running on PORT %d in %s mode.",
      PORT,
      server.get("env"),
    );
  });
})();
