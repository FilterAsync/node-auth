import { createApp } from "./app.mjs";
import * as dotenv from "dotenv";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import mongoose from "mongoose";
import { RedisOptions } from "./config/cache.mjs";

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
  const RedisStore = connectRedis(session);

  const client = new Redis({ RedisOptions });

  const store = new RedisStore({ client: client });

  const app = createApp(store);
  app.listen(PORT, function () {
    console.log(
      "Server is running on PORT %d in %s mode.",
      PORT,
      app.get("env")
    );
  });
})();
