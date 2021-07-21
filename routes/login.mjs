"use strict";
import express from "express";
import {
  isAuthenticated,
  isUnauthenticated,
} from "../middleware/auth.mjs";
import { logOut } from "../auth.mjs"
import { User } from "../models/user.mjs";
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

router.delete("/close-account", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.passport.user);
  try {
    await user.delete();
    await logOut(req, res);
    res.status(200).redirect("/login");
  } catch (err) {
    res.status(500).redirect("/");
  }
});

export { router as login };
