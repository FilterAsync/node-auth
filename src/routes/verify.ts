import express from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { isUnauthenticated } from "../middleware";
import { client } from "../config/cache";
import { User } from "../models";
import { sendMail } from "../mail";
import { verificationQuery } from "../interfaces";
import { markAsVerified } from "../auth";
import { message, s } from "../utils";
import * as dotenv from "dotenv";
import { emailVerificationSchema, emailVerifyStepSchema } from "../validation";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const router = express.Router();

router.get(
	"/register/email-verify-step",
	isUnauthenticated,
	(req, res, next) => {
		const { error } = emailVerifyStepSchema.validate(req.query);
		if (error) {
			res.status(404).render("404");
			return;
		}
		next();
	},
	async (req, res) => {
		const { email, expires } = req.query;
		const Expires = expires as string;

		let user;
		if (
			!+Expires ||
			!(
				+Expires > Date.now() &&
				+Expires - Date.now() < +(ENV.EMAIL_VERIFICATION_TIMEOUT as string)
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

router.get(
	"/email/verify",
	isUnauthenticated,
	async (req, res, next) => {
		const { error } = emailVerificationSchema.validate(req.query);
		if (error) {
			res.status(404).render("404");
			return;
		}
		next();
	},
	async (req, res) => {
		const query = req.query as unknown as verificationQuery;
		const { id } = req.query;
		let user;
		try {
			user = await User.findById(id);
			if (
				!user ||
				!User.hasValidVerificationUrl(req.originalUrl, query) ||
				user.verifiedAt
			) {
				res.status(400).render("404");
				return;
			}
		} catch (err) {
			console.error(err);
			res.status(500).redirect("/login");
			return;
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
	}
);

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post(
	"/email/resend",
	isUnauthenticated,
	rateLimit({
		store: new RedisStore({
			client: client,
			expiry: s("1m"),
		}),
		headers: false,
		max: 2,
		handler: (_, res) => {
			res.status(429).json({
				message: "Too many requests please try again later.",
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
