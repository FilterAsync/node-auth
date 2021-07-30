import express from "express";
import { isUnauthenticated } from "../middleware/auth";
import { User } from "../models/user";
import { PasswordReset } from "../models/pwsd-reset";
import { sendMail } from "../mail";
import { resetPassword } from "../auth";
import * as dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { client } from "../config/cache";
import { pwsdResetSchema } from "../validation";
import { s } from "../utils";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const router = express.Router();

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router
	.route("/reset-password")
	.get(isUnauthenticated, (_, res) => res.render("reset-password"))
	.post(
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
					message: "Too many requests, please try again later.",
				});
			},
		}),
		async (req, res) => {
			const { email } = req.body;
			const user = await User.findByEmail(email);

			if (user) {
				const token = PasswordReset.plaintextToken();

				await PasswordReset.deleteMany({ userId: user._id });

				const reset = new PasswordReset({
					userId: user._id,
					token: token,
					expiredAt: new Date(
						new Date().getTime() + +(ENV.PASSWORD_RESET_TIMEOUT as string)
					),
				});

				await Promise.all([
					reset.save(),
					sendMail({
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
					}),
				]);
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

router
	.route("/password/reset")
	.get(
		isUnauthenticated,
		(req, res, next) => {
			const { error } = pwsdResetSchema.validate(req.query);
			if (error) {
				res.status(404).render("404");
				return;
			}
			next();
		},
		async (req, res) => {
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
				!reset.isValidUrl(token as string) ||
				!(user = await User.findById(reset.userId).select(
					"username visibleEmail"
				))
			) {
				res.status(400).json({
					message: "Page not found",
					status: "404",
				});
				return;
			}

			res.render("password-reset", { user: user });
		}
	)
	.post(isUnauthenticated, async (req, res) => {
		const { id, token } = req.query;
		const { password, passwordConfirm } = req.body;

		if (
			!User.validPassword(password) ||
			!User.validPassword(passwordConfirm) ||
			password !== passwordConfirm
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
			!reset.isValidUrl(token as string) ||
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
