"use strict";
import express from "express";
import {
  isAuthenticated,
  isUnauthenticated,
} from "../middleware/auth.mjs";
import { logOut } from "../auth.mjs";
import rateLimit from "express-rate-limit";
import passport from "passport";

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
  });
});

router.use(express.urlencoded({ extended: false }));

router.post(
  "/login",
  isUnauthenticated,
	rateLimit({
		windowMs: 60 * 60 * 1E3,
		max: 10,
		handler: function(_req, res) {
			res.status(429).render("login", {
				tooManyRequests: true,
				error: false,
    		sessionExpired: false,
    		redirectUri: false,
			});
		},
	}),
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
          maxAge: 604800000,
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
