"use strict";

import mongoose from "mongoose";
import crypto from "crypto";
import { compare } from "bcrypt";
import * as dotenv from "dotenv";

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      alias: "name",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    visibleEmail: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      unique: true,
      required: true,
    },
    verifiedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.gravatar = async function (size = 96) {
  const hash = crypto.createHash("md5").update(this.visibleEmail).digest("hex");

  return `https://gravatar.com/avatar/${hash}?s=${size}&d=mp`;
};

UserSchema.statics.findByName = async function (username) {
  return await this.findOne({ username: username });
};

UserSchema.methods.matchesPassword = function (password) {
  return compare(password, this.password);
};

UserSchema.statics.matchesUsername = (username) =>
  /^(?=^[^_]+_?[^_]+$)\w{3,20}$/.test(username);

UserSchema.statics.matchesEmail = (email) =>
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,4}))$/.test(
    email
  );

UserSchema.methods.createVerificationUrl = function () {
  const token = crypto.createHash("sha1").update(this.email).digest("hex");
  const expires = Date.now() + +env.EMAIL_VERIFICATION_TIMEOUT;

  const url = `${env.APP_ORIGIN}/email/verify?id=${this._id}&token=${token}&expires=${expires}`;
  const signature = User.signVerificationUrl(url);

  return `${url}&signature=${signature}`;
};

UserSchema.statics.signVerificationUrl = (url) =>
  crypto.createHmac("sha256", env.APP_SECRET).update(url).digest("hex");

UserSchema.statics.hasValidVerificationUrl = (path, query) => {
  const url = `${env.APP_ORIGIN}${path}`;
  const original = url.slice(0, url.lastIndexOf("&"));
  const signature = User.signVerificationUrl(original);

  return (
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(query.signature)
    ) && (+query.expires > Date.now() &&
			+query.expires - Date.now() <= env.EMAIL_VERIFICATION_TIMEOUT
		)
  );
};

export const User = mongoose.model("User", UserSchema);
