import express from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { isUnauthenticated } from "../middleware";
import { client } from "../config/cache";
import { User } from "../models";
import { sendMail } from "../mail";
import { message } from "../utils/email-message";
import { verificationQuery } from "../interfaces";
import { UserDocument } from "../interfaces";
import { markAsVerified } from "../auth";
import ms from "ms";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const router = express.Router();

router.get(
	"/register/email-verify-step",
	isUnauthenticated,
	async (req, res) => {
		const { email, expires } = req.query;
		if (!expires) {
			return;
		}
		let user;
		if (
			!+(expires as string) ||
			!(
				+expires > Date.now() &&
				+expires - Date.now() < +(ENV.EMAIL_VERIFICATION_TIMEOUT as string)
			) ||
			!(user = await User.findOne({
				email: email as string,
			}).select("username visibleEmail verifiedAt")) ||
			user.verifiedAt
		) {
			res.status(404).render("404");
			return;
		}
		res.render("email-verify-step", { user: user });
	}
);

router.get("/email/verify", isUnauthenticated, async (req, res) => {
	const { id, token, expires, signature } = req.query;
	if (!id || !token || !expires || !signature) {
		res.status(404).render("404");
		return;
	}
	const user = (await User.findById(id)) as UserDocument;
	try {
		const query = req.query as unknown as verificationQuery;
		if (
			!user ||
			!User.hasValidVerificationUrl(req.originalUrl, query) ||
			user.verifiedAt
		) {
			res.status(400).redirect("/login");
			return;
		}
	} catch (err) {
		res.status(500).redirect("/login");
	}

	await markAsVerified(user);

	req.logIn(user, (err: any) => {
		if (err) {
			res.status(500).json({
				message: "Failed to login.",
				status: "500",
			});
			return;
		}
		res.status(200).redirect("/");
	});
});

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post(
	"/email/resend",
	isUnauthenticated,
	rateLimit({
		store: new RedisStore({
			client: client,
			expiry: ms("1m") / 1e3,
		}),
		headers: false,
		max: 2,
		handler: (_, res) => {
			res.status(429).json({
				message: "You only can resend again after 1 minute.",
			});
		},
	}),
	async (req, res) => {
		const { email } = req.query;

		const user = await User.findOne({
			email: email as string,
		}).select("username email visibleEmail verifiedAt");

		if (user && !user.verifiedAt) {
			const verifyLink = user.createVerificationUrl();

			await sendMail({
				to: user.visibleEmail,
				subject: "Email verification",
				html: message(user, verifyLink),
			});
		}

		res.status(200).json({
			message: "Successfully resent email.",
		});
	}
);

export { router as verify };
