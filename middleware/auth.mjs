"use strict";
import catchAsync from "express-async-handler";
import * as dotenv from "dotenv"
import { Unauthorized } from "../errors/index.mjs";

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).redirect("/login");
}

export function isUnauthenticated(req, res, next) {
  if (req.isUnauthenticated()) {
    return next();
  }
  res.status(301).redirect("/");
}

export const logOut = (req, res) => {
  return new Promise((resolve, reject) => {
    req.session.destroy(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve("Success");
      res.status(401).redirect("/login");
    });
  });
}

export const active = catchAsync(async (req, res, next) => {
  if (req.isAuthenticated()) {
    const now = Date.now();

    if (now > req.session.createdAt + (+env.SESSION_TIMEOUT)) {
      await logOut(req, res);
      return next(
        new Unauthorized("Session expired")
      );
    }
    req.session.createdAt = now;
    next();
    return;
  }
  next();
});
