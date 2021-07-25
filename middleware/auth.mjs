import * as dotenv from "dotenv";
import { logOut } from "../auth.mjs";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	const isHomepage =
		req.path !== "/"
			? "/login?redirectUri=" + encodeURIComponent(req.originalUrl)
			: "/login";

	res.status(401).redirect(isHomepage);
}

export function isUnauthenticated(req, res, next) {
	if (req.isUnauthenticated()) {
		return next();
	}
	res.status(301).redirect("/");
}

export const active = async (req, res, next) => {
	if (req.isAuthenticated()) {
		const now = Date.now();

		if (now > req.session.createdAt + 3000) {
			await logOut(req, res, "/login?session_expired=true");
			return next(new Error("Session expired"));
		}
		req.session.createdAt = now;
	}
	next();
};
