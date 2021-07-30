import mongoose from "mongoose";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { UserDocument, UserModel } from "../interfaces";
import { verificationQuery } from "../interfaces/others";
import { pwsdHash, comparePwsd } from "../utils";

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

UserSchema.methods.gravatar = function (size: number = 96) {
	const hash = crypto.createHash("md5").update(this.visibleEmail).digest("hex");

	return `https://gravatar.com/avatar/${hash}?s=${size}&d=mp`;
};

UserSchema.statics.findByName = async function (username: string) {
	return await this.findOne({ username: username });
};

UserSchema.statics.findByEmail = async function (email: string) {
	return await this.findOne({ visibleEmail: email });
};

UserSchema.statics.validPassword = (password: string) =>
	/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{10,}$/.test(
		password
	);

UserSchema.statics.validUsername = (username: string) =>
	/^(?=^[^_]+_?[^_]+$)\w{3,20}$/.test(username);

UserSchema.statics.validEmail = (email: string) =>
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,4}))$/.test(
		email
	);

UserSchema.methods.matchesPassword = function (password: string) {
	return User.validPassword(password) && comparePwsd(password, this.password);
};

UserSchema.methods.createVerificationUrl = function () {
	const token = crypto.createHash("sha1").update(this.email).digest("hex");
	const expires = Date.now() + +(ENV.EMAIL_VERIFICATION_TIMEOUT as string);

	const url = `${ENV.APP_ORIGIN}/email/verify?id=${this._id}&token=${token}&expires=${expires}`;
	const signature = User.signVerificationUrl(url);

	return `${url}&signature=${signature}`;
};

UserSchema.statics.signVerificationUrl = (url: string) =>
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
		this.password = await pwsdHash(this.password);
	}
});

UserSchema.post("save", function () {
	console.log(
		`Saving logger: "User '${
			this.username
		}' updated at ${new Date().toLocaleString()}."`
	);
});

export const User = mongoose.model<UserDocument, UserModel>("User", UserSchema);
