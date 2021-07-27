import express from "express";
import { isAuthenticated, isUnauthenticated } from "../middleware/auth";
import { logOut } from "../auth";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { RememberMe } from "../models/rem-me";
import ms from "ms";
import RedisStore from "rate-limit-redis";
import { client } from "../config/cache";

const router = express.Router();

router.use(express.urlencoded({ extended: false }));

router
	.route("/login")
	.get(isUnauthenticated, (req, res) => {
		res.render("login", {
			error: req.query.error,
			sessionExpired: req.query.session_expired,
			redirectUri: req.query.redirectUri,
			tooManyRequests: false,
		});
	})
	.post(
		isUnauthenticated,
		rateLimit({
			store: new RedisStore({
				client: client,
				expiry: ms("2h") / 1e3,
			}),
			headers: false,
			max: 10,
			handler: (_req, res) => {
				res.status(429).render("login", {
					tooManyRequests: true,
					error: false,
					redirectUri: false,
					sessionExpired: false,
				});
			},
		}),
		passport.authenticate("local", {
			failureRedirect: "/login",
			failureFlash: "Invalid credentials",
		}),
		async (req, res) => {
			if (req.body["rem-me"] === "on") {
				if (!req.cookies["rem-me"]) {
					const { eou, password } = req.body;

					const token = RememberMe.plaintextToken();
					const remMe = new RememberMe({
						token: token,
						credentials: {
							username: Buffer.from(eou, "binary").toString("hex"),
							password: Buffer.from(password, "binary").toString("hex"),
						},
					});
					await remMe.save();

					res.cookie("rem-me", token, {
						maxAge: ms("7d"),
					});
				}
			} else {
				res.clearCookie("rem-me");
			}
			const { redirectUri } = req.query;
			if (typeof redirectUri === "string" && redirectUri.startsWith("/")) {
				res.status(200).redirect(redirectUri);
				return;
			}
			req.session!.createdAt = Date.now();
			res.status(200).redirect("/");
		}
	);

router.post("/remember-me/load", isUnauthenticated, async (req, res) => {
	const { requestToken } = req.query;
	if (!requestToken) {
		res.status(400).end();
		return;
	}
	const hashedToken = RememberMe.hashedToken(requestToken as string);

	const remMe = await RememberMe.findOne({
		token: hashedToken,
	});
	if (remMe) {
		if (+remMe.expiresAt < Date.now()) {
			await remMe.delete();
			res.clearCookie("rem-me").status(401).json({
				message: "Remember me token is expired.",
			});
			return;
		}
		const {
			credentials: { username, password },
		} = remMe;

		res.status(200).json({
			data: [
				Buffer.from(username, "hex").toString("binary"),
				Buffer.from(password, "hex").toString("binary"),
			],
		});
		return;
	}
	res.status(400).end();
});

router.delete("/logout", isAuthenticated, async (req, res, next) =>
	logOut(req, res, next)
);

export { router as login };
