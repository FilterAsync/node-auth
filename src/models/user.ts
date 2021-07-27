import mongoose from "mongoose";
import crypto from "crypto";
import { hash, compare } from "bcrypt";
import * as dotenv from "dotenv";
import { UserDocument, UserModel } from "../interfaces";
import { verificationQuery } from "../interfaces/others";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const UserSchema = new mongoose.Schema<UserDocument>(
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

UserSchema.methods.gravatar = function (size = 96) {
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
	const expires = Date.now() + +(ENV.EMAIL_VERIFICATION_TIMEOUT as string);

	const url = `${ENV.APP_ORIGIN}/email/verify?id=${this._id}&token=${token}&expires=${expires}`;
	const signature = User.signVerificationUrl(url);

	return `${url}&signature=${signature}`;
};

UserSchema.statics.signVerificationUrl = (url) =>
	crypto
		.createHmac("sha256", ENV.APP_SECRET as string)
		.update(url)
		.digest("hex");

UserSchema.statics.hasValidVerificationUrl = (
	path: string,
	query: verificationQuery
) => {
	const url = `${ENV.APP_ORIGIN}${path}`;
	const original = url.slice(0, url.lastIndexOf("&"));
	const signature = User.signVerificationUrl(original);

	const { expires } = query;

	return (
		crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(query.signature)
		) &&
		+expires > Date.now() &&
		+expires - Date.now() <= +(ENV.EMAIL_VERIFICATION_TIMEOUT as string)
	);
};

UserSchema.pre("save", async function () {
	if (this.isModified("password")) {
		this.password = await hash(this.password, +(ENV.BCRYPT_SALT as string));
	}
});

export const User = mongoose.model<UserDocument, UserModel>("User", UserSchema);
