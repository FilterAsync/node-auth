"use strict";
import mongoose from "mongoose";
import crypto from "crypto";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const RememberMeSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Types.ObjectId,
			required: true,
			ref: "User",
		},
		token: String,
		data: Object,
		expiredAt: Date || Number,
	},
	{
		timestamps: {
			createdAt: true,
			updatedAt: false,
		},
	},
);

RememberMeSchema.pre("save", function() {
	if (this.isModified("token")) {
		this.token = RememberMe.hashedToken(this.token);
	}
	if (!this.expiredAt) {
		this.expiredAt = new Date(
			new Date().getTime() + +ENV.REMEMBER_ME_TIMEOUT,
		);
	}
});

RememberMeSchema.statics.plaintextToken = function() {
	return crypto.randomBytes(+ENV.REMEMBER_ME_RANDOM_BYTES).toString("hex");
}

RememberMeSchema.statics.hashedToken = (ptt) =>
	crypto.createHmac("sha256", ENV.APP_SECRET).update(ptt).digest("hex");

export const RememberMe = mongoose.model(
	"RememberMe",
	RememberMeSchema,
);
