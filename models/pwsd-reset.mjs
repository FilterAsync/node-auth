"use strict";

import mongoose from "mongoose";
import crypto from "crypto";
import * as dotenv from "dotenv";

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

const PasswordResetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    token: String,
    expiredAt: Date || Number,
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

PasswordResetSchema.pre("save", function () {
  if (this.isModified("token")) {
    this.token = PasswordReset.hashedToken(this.token);
  }
  if (!this.expiredAt) {
    this.expiredAt = new Date(
      new Date().getTime() + env.PASSWORD_RESET_TIMEOUT
    );
  }
});

PasswordResetSchema.methods.createResetPasswordUrl = function (ptt) {
  return `${env.APP_ORIGIN}/password/reset?id=${this._id}&token=${ptt}`;
};

PasswordResetSchema.methods.isValidUrl = function (ptt) {
  const hash = PasswordReset.hashedToken(ptt);

  return (
    crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(this.token)) && (
			+this.expiredAt > Date.now() &&
			+this.expiredAt - Date.now() <= env.PASSWORD_RESET_TIMEOUT
		)
  );
};

PasswordResetSchema.statics.plaintextToken = function () {
  return crypto.randomBytes(+env.PASSWORD_RANDOM_BYTES).toString("hex");
};

PasswordResetSchema.statics.hashedToken = (ptt) =>
  crypto.createHmac("sha256", env.APP_SECRET).update(ptt).digest("hex");

export const PasswordReset = mongoose.model(
  "PasswordReset",
  PasswordResetSchema
);
