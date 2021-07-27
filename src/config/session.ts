import * as dotenv from "dotenv";
import { SessionOptions } from "express-session";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const sessionOptions: SessionOptions = {
	secret: ENV.SESSION_SECRET as string,
	name: ENV.SESSION_NAME,
	cookie: {
		sameSite: true,
		maxAge: +(ENV.SESSION_TIMEOUT as string),
		secure: "auto",
	},
	resave: false,
	saveUninitialized: true,
};
