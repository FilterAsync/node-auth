import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const sessionOptions = {
	secret: ENV.SESSION_SECRET,
	name: ENV.SESSION_NAME,
	cookie: {
		sameSite: true,
		maxAge: +ENV.SESSION_TIMEOUT,
		secure: "auto",
	},
	resave: false,
	saveUninitialized: true,
};
