import mongoose from "mongoose";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { RememberMeDocument, RememberMeModel } from "../interfaces";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const RememberMeSchema = new mongoose.Schema<RememberMeDocument>({
	token: String,
	credentials: {
		type: Object,
		required: true,
	},
	expiresAt: Date || Number,
	createdAt: {
		type: Date,
		required: true,
		default: Date.now(),
		index: {
			expires: "7d",
		},
	},
});

RememberMeSchema.statics.plaintextToken = function () {
	return crypto
		.randomBytes(+(ENV.REMEMBER_ME_RANDOM_BYTES as string))
		.toString("hex");
};

RememberMeSchema.statics.hashedToken = (ptt: string) =>
	crypto
		.createHmac("sha256", ENV.APP_SECRET as string)
		.update(ptt)
		.digest("hex");

RememberMeSchema.pre("save", function () {
	if (this.isModified("token")) {
		this.token = RememberMe.hashedToken(this.token);
	}
	if (!this.expiresAt) {
		this.expiresAt = new Date(
			new Date().getTime() + +(ENV.REMEMBER_ME_TIMEOUT as string)
		);
	}
});

export const RememberMe = mongoose.model<RememberMeDocument, RememberMeModel>(
	"RememberMe",
	RememberMeSchema
);
