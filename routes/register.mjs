import express from "express";
import { User } from "../models/user.mjs";
import crypto from "crypto";
import { sendMail } from "../mail.mjs";
import { isUnauthenticated } from "../middleware/auth.mjs";
import { markAsVerified } from "../auth.mjs";
import * as dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import assert from "assert";
import ms from "ms";
import RedisStore from "rate-limit-redis";
import { client } from "../config/cache.mjs";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const router = express.Router({
	caseSensitive: true,
	mergeParams: true,
	strict: true,
});

router.get("/register", isUnauthenticated, (req, res) =>
	res.render("register")
);

router.get(
	"/register/email-verify-step",
	isUnauthenticated,
	async (req, res) => {
		const { email, expires } = req.query;
		console.log(email, expires);
		let user;
		if (
			!+expires ||
			!(
				+expires > Date.now() &&
				+expires - Date.now() < ENV.EMAIL_VERIFICATION_TIMEOUT
			) ||
			!(user = await User.findOne({
				email: email,
			}).select("username visibleEmail verifiedAt")) ||
			user.verifiedAt
		) {
			res.status(404).render("404");
			return;
		}
		console.log(user);
		res.render("email-verify-step", { user: user });
	}
);

router.get("/email/verify", isUnauthenticated, async (req, res) => {
	const { id, token, expires, signature } = req.query;
	if (!id || !token || !expires || !signature) {
		res.status(404).render("404");
		return;
	}
	const user = await User.findById(id);
	try {
		if (
			!user ||
			!User.hasValidVerificationUrl(req.originalUrl, req.query) ||
			user.verifiedAt
		) {
			res.status(400).redirect("/login");
			return;
		}
	} catch (err) {
		res.status(500).redirect("/login");
	}

	await markAsVerified(user);

	req.logIn(user, (err) => {
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

function message(user, verifyLink) {
	return `
    <h4>Hello ${user.username},</h4>
    <p>
      We're happy you signed up.
      <br />
      To start exploring the app, please confirm your email address by clicking the link below.
    </p>
    <a href="${verifyLink}" target="_blank">
      Verification
    </a>
    <br />
    <br />
    <small>
      This verification link will expire in 12 hours.
    </small>
    `;
}

router.post(
	"/register",
	isUnauthenticated,
	rateLimit({
		store: new RedisStore({
			client: client,
			expiry: ms("1d") / 1e3,
		}),
		headers: false,
		max: 3,
		handler: (_req, res) => {
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

router.post(
	"/email/resend",
	isUnauthenticated,
	rateLimit({
		store: new RedisStore({
			client: client,
			expiry: ms("2m") / 1e3,
		}),
		headers: false,
		max: 1,
		handler: (_req, res) => {
			res.status(429).json({
				message: "You only can resend again after 2 minutes.",
			});
		},
	}),
	async (req, res) => {
		const { email } = req.query;

		const user = await User.findOne({
			email: email,
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

router.post("/available", isUnauthenticated, async (req, res) => {
	const field = req.query.field || "username";
	const value = req.query.value || "";
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
