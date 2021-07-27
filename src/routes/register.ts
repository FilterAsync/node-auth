import express from "express";
import { User } from "../models/user";
import crypto from "crypto";
import { sendMail } from "../mail";
import { isUnauthenticated } from "../middleware/auth";
import * as dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import assert from "assert";
import ms from "ms";
import RedisStore from "rate-limit-redis";
import { client } from "../config/cache";
import { message } from "../utils/email-message";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const router = express.Router();

router
	.route("/register")
	.get(isUnauthenticated, (_, res) => res.render("register"))
	.post(
		isUnauthenticated,
		rateLimit({
			store: new RedisStore({
				client: client,
				expiry: ms("1d") / 1e3,
			}),
			headers: false,
			max: 3,
			handler: (_, res) => {
				res.status(429).json({
					message: "Too many requests, please try again later.",
				});
			},
		}),
		async (req, res) => {
			const { username, email, password } = req.body;
			if (
				!User.matchesUsername(username) ||
				!User.matchesEmail(email) ||
				!password ||
				password.length < 8
			) {
				res.status(400).json({
					message: "Failed to register.",
				});
				return;
			}

			const confirmPassword = req.body["confirm-password"];
			try {
				assert.strictEqual(
					crypto.timingSafeEqual(
						Buffer.from(password),
						Buffer.from(confirmPassword)
					),
					true
				);
			} catch (err) {
				res.status(400).json({
					message: "Password does not match.",
				});
				return;
			}
			const usernameExists = await User.exists({ username: username });
			const emailExists = await User.exists({ email: email });
			if (usernameExists || emailExists) {
				res.status(409).json({
					message: "Username or email was taken.",
				});
				return;
			}
			const emailHash = crypto.createHmac("sha1", email).digest("hex");

			const user = new User({
				username: username,
				email: emailHash,
				visibleEmail: email,
				password: password,
				verifiedAt: null,
			});
			user.avatarUrl = await user.gravatar(96);
			user.save();

			const verifyLink = user.createVerificationUrl();
			try {
				await sendMail({
					to: user.visibleEmail,
					subject: "Email verification",
					html: message(user, verifyLink),
				});
			} catch (err) {
				console.error(err);
				res.status(500).json({
					message: "Failed to send email.",
				});
				return;
			}

			res.status(200).json({
				link:
					"/register/email-verify-step?email=" +
					user.email +
					"&expires=" +
					new URL(verifyLink).searchParams.get("expires"),
			});
		}
	);

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post("/available", isUnauthenticated, async (req, res) => {
	const field = req.query.field || "username";
	const value = (req.query.value as string) || "";
	res.status(200).json({
		wasTaken: await User.exists(
			field === "username"
				? {
						username: value,
				  }
				: {
						visibleEmail: value,
				  }
		),
	});
});

export { router as register };
