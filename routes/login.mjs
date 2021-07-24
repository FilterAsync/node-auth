"use strict";
import express from "express";
import {
  isAuthenticated,
  isUnauthenticated,
} from "../middleware/auth.mjs";
import { logOut } from "../auth.mjs";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { rateLimitInit } from "../config/index.mjs";

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
	rateLimit(
		rateLimitInit({
			windowMs: 2 * 60 * 60 * 1E3,
			max: 10,
			handler: (_req, res) => {
				res.status(429).render("login", {
						tooManyRequests: true,
						error: false,
						redirectUri: false,
						sessionExpired: false,
					}
				);
			},
		}),
	),
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid credentials",
  }),
  (req, res) => {
		console.log(req.cookies);
		console.log(req.signedCookies);
    if (req.body["rem-me"]) {
			if (!req.cookies["rem-me"]) {
				res.cookie(
					"rem-me",
					`{"username":"${
							Buffer.from(req.body.eou, "binary").toString("hex")
						}","password":"${Buffer.from(req.body.password, "binary")
							.toString("hex")
						}"}`,
					{
						maxAge: 24 * 60 * 60 * 7 * 1E3,
					}
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

router.use(express.json());

router.post(
	"/rem-me/load",
	isUnauthenticated,
	async (req, res) => {
		const { remMeData } = req.body;
		if (
			"username" in remMeData &&
			"password" in remMeData
		) {
			const parseData = [
				Buffer.from(remMeData.username, "hex").toString("binary"),
				Buffer.from(remMeData.password, "hex").toString("binary"),
			];
			res.status(200).json({
				parseData: parseData,
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
