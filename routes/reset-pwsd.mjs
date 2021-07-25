import express from "express";
import { isUnauthenticated } from "../middleware/auth.mjs";
import { User } from "../models/user.mjs";
import { PasswordReset } from "../models/pwsd-reset.mjs";
import { sendMail } from "../mail.mjs";
import { resetPassword } from "../auth.mjs";
import * as dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { client } from "../config/cache.mjs";
import ms from "ms";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const router = express.Router({
	caseSensitive: true,
	mergeParams: true,
	strict: true,
});

router.get("/reset-password", isUnauthenticated, (req, res) =>
	res.render("reset-password")
);

router.get("/password/reset", isUnauthenticated, async (req, res) => {
	const { id, token } = req.query;

	let reset;

	try {
		reset = await PasswordReset.findById(id);
	} catch (err) {
		res.status(404).render("404");
		return;
	}
	let user;

	if (
		!reset ||
		!reset.isValidUrl(token) ||
		!(user = await User.findById(reset.userId).select("username visibleEmail"))
	) {
		res.status(400).json({
			message: "Page not found",
			status: "404",
		});
		return;
	}

	res.render("password-reset", { user: user });
});

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post(
	"/reset-password",
	isUnauthenticated,
	rateLimit({
		store: new RedisStore({
			client: client,
			expiry: ms("2m") / 1E3,
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
		const { email } = req.body;
		const user = await User.findOne({ visibleEmail: email });

		if (user) {
			const token = PasswordReset.plaintextToken();

			await PasswordReset.deleteMany({
				userId: user._id,
			});

			const reset = new PasswordReset({
				userId: user._id,
				token: token,
				expiredAt: new Date(new Date().getTime() + +ENV.PASSWORD_RESET_TIMEOUT),
			});

			reset.save();

			await sendMail({
				to: email,
				subject: "Reset your password",
				html: `
                <h4>Hello ${user.username},</h4>
                <p>
                    A request has been received to change the password for your account.
                </p>
                <a href="${reset.createResetPasswordUrl(
									token
								)}" target="_blank">
                    Reset Password
                </a>
                <br/>
                <br/>
                <small>Thank you.</small>`,
			});
			res.status(200).json({
				message: `Email has sent to ${user.username}.`,
			});
			return;
		}
		res.status(400).json({
			message: "Email not available.",
		});
	}
);

router.post("/password/reset", isUnauthenticated, async (req, res) => {
	const { id, token } = req.query;
	const { password, passwordConfirm } = req.body;

	if (
		password.length < 8 ||
		passwordConfirm.length < 8 ||
		passwordConfirm !== password
	) {
		res.status(400).json({
			message: "Password does not match.",
		});
		return;
	}

	const reset = await PasswordReset.findById(id);
	let user;

	if (
		!reset ||
		!reset.isValidUrl(token) ||
		!(user = await User.findById(reset.userId))
	) {
		res.status(400).json({
			message: "Invalid password reset token.",
		});
		return;
	}

	await Promise.all([
		resetPassword(user, password),
		PasswordReset.deleteMany({
			userId: reset.userId,
		}),
	]);

	req.logIn(user, (err) => {
		if (err) {
			console.error(err);
			res.status(500).redirect("/login");
			return;
		}
		res.status(200).redirect("/");
	});
});

export { router as resetPassword };
