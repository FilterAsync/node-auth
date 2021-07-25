"use strict";
import express from "express";
import {
  isAuthenticated,
  isUnauthenticated,
} from "../middleware/auth.mjs";
import { logOut } from "../auth.mjs";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { RememberMe } from "../models/rem-me.mjs";
import { User } from "../models/user.mjs";
import ms from "ms";

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true,
});

router.get("/login", isUnauthenticated, (req, res) => {
  res.render("login", {
    error: req.query.error,
    sessionExpired: req.query.session_expired,
    redirectUri: req.query.redirectUri,
		tooManyRequests: false,
  });
});

router.use(express.urlencoded({ extended: false }));

router.post(
  "/login",
  isUnauthenticated,
	rateLimit({
			windowMs: ms("2h"),
			max: 10,
			handler: (_req, res) => {
				res.status(429).render("login", {
						tooManyRequests: true,
						error: false,
						redirectUri: false,
						sessionExpired: false,
					},
				);
			},
		},
	),
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid credentials",
  }),
  async (req, res) => {
		if (req.body["rem-me"] === "on") {
			if (!req.cookies["rem-me"]) {
				const { eou, password } = req.body;

				const EoU 		= User.matchesEmail(eou) ? "email" : "username"
				const user		= await User.findOne(
					EoU === "email" ? {
						visibleEmail: eou,
					} : {
						username: eou,
					},
				);

				const token 	= RememberMe.plaintextToken();
				const remMe 	= new RememberMe({
					userId: 		user._id,
					token: 			token,
					data: {
						username: Buffer.from(eou, "binary").toString("hex"),
						password: Buffer.from(password, "binary").toString("hex"),
					},
				});
				await remMe.save();

				res.cookie(
					"rem-me",
					token,
					{
						maxAge: ms("7d"),
					},
				);
			}
    } else {
      res.clearCookie("rem-me");
    }
    const { redirectUri } = req.query;
    if (typeof redirectUri === "string" && redirectUri.startsWith("/")) {
      res.status(200).redirect(redirectUri);
      return;
    }
    req.session.createdAt = Date.now();
    res.status(200).redirect("/");
  }
);

router.post(
	"/remember-me/load",
	isUnauthenticated,
	async (req, res) => {
		const { requestToken } 	= req.query;
		const hashedToken 		 	= RememberMe.hashedToken(requestToken);

		const remMeDoc = await RememberMe.findOne({
			token: hashedToken,
		});
		if (remMeDoc) {
			if (+remMeDoc.expiredAt < Date.now()) {
				await remMeDoc.delete();
				res.clearCookie("rem-me").status(401).json({
					message: "Remember me token is expired.",
				});
				return;
			}
			res.status(200).json({
				data: [
					Buffer.from(
						remMeDoc.data.username, "hex"
					).toString("binary"),
					Buffer.from(
						remMeDoc.data.password, "hex"
					).toString("binary"),
				],
			});
			return;
		}
		res.status(400).end();
	}
);

router.delete(
  "/logout",
  isAuthenticated,
  async (req, res) => await logOut(req, res)
);

export { router as login };
