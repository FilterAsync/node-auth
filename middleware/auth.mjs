"use strict";
import catchAsync from "express-async-handler";
import * as dotenv from "dotenv";
import { Unauthorized } from "../errors/index.mjs";
import { logOut } from "../auth.mjs";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
  dotenv.config();
}

export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  const isHomepage =
    req.path !== "/"
      ? "/login?redirectUri=" + encodeURIComponent(req.originalUrl)
      : "/login";

  res.status(401).redirect(isHomepage);
}

export function isUnauthenticated(req, res, next) {
  if (req.isUnauthenticated()) {
    return next();
  }
  res.status(301).redirect("/");
}

export const active = catchAsync(async (req, res, next) => {
  if (req.isAuthenticated()) {
    const now = Date.now();

    if (now > req.session.createdAt + +ENV.SESSION_TIMEOUT) {
      await logOut(req, res, "/login?session_expired=true");
      return next(new Unauthorized("Session expired"));
    }
    req.session.createdAt = now;
  }
  next();
});
