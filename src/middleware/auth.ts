import { RequestHandler } from "express";
import { logOut } from "../auth";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}

	const isHomepage =
		req.path !== "/"
			? "/login?redirectUri=" + encodeURIComponent(req.originalUrl)
			: "/login";

	res.status(401).redirect(isHomepage);
};

export const isUnauthenticated: RequestHandler = (req, res, next) => {
	if (req.isUnauthenticated()) {
		return next();
	}
	res.status(301).redirect("/");
};

export const active: RequestHandler = async (req, res, next) => {
	if (req.isAuthenticated()) {
		const now = Date.now();

		if (now > req.session!.createdAt + +(ENV.SESSION_TIMEOUT as string)) {
			logOut(req, res, next);
			return next(new Error("Session expired"));
		}
		req.session!.createdAt = now;
	}
	next();
};
