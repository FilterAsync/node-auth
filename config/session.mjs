"use strict";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
  dotenv.config();
}

export const sessionOptions = {
  secret: ENV.SESSION_SECRET,
  name: ENV.SESSION_NAME,
	resave: false,
  saveUninitialized: true,
};
