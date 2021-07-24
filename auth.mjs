"use strict";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
  dotenv.config();
}

export const logOut = (req, res, redirect = "/login") => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }
      res.clearCookie(ENV.SESSION_NAME);
      resolve("Success");

      res.status(401).redirect(redirect);
    });
  });
};

export const markAsVerified = async (user) => {
  user.verifiedAt = Date.now();
  await user.save();
};

export const resetPassword = async (user, password) => {
  user.password = password;
  await user.save();
};
