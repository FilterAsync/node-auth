import * as dotenv from "dotenv";

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

export const sessionOptions = {
  secret: env.SESSION_SECRET,
  resave: false,
  name: env.SESSION_NAME,
  saveUninitialized: false,
};
