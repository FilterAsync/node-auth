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
	rateLimit(
		rateLimitInit({
			windowMs: ms("15m"),
			max: 3,
			handler: (_req, res) => {
				res.status(429).render("login", { tooManyRequests: true, });
			},
		})
	),
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid credentials",
  }),
  (req, res) => {
    if (req.body["rem-me"]) {
      res.cookie(
        "rem-me",
        `{"username":"${req.body.eou}","password":"${req.body.password}"}`,
        {
          maxAge: ms("7d"),
        }
      );
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

router.delete(
  "/logout",
  isAuthenticated,
  async (req, res) => await logOut(req, res)
);

export { router as login };
