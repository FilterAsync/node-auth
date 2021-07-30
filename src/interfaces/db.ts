import { Document, Types, Model } from "mongoose";
import { verificationQuery } from "./others";

export interface UserDocument extends Document {
	username: string;
	email: string;
	visibleEmail: string;
	password: string;
	verifiedAt?: number | Date | null;
	avatarUrl: string;
	createVerificationUrl: () => string;
	gravatar: (size: number) => Promise<string>;
	matchesPassword: (password: string) => Promise<boolean>;
}

export interface RememberMeDocument extends Document {
	readonly credentials: {
		readonly username: string;
		readonly password: string;
	};
	token: string;
	expiresAt: Date;
}

export interface PasswordResetDocument extends Document {
	readonly userId: Types.ObjectId;
	token: string;
	expiresAt: Date;
	isValidUrl: (ptt: string) => boolean;
	createResetPasswordUrl: (ptt: string) => string;
}

export interface UserModel extends Model<UserDocument> {
	validEmail: (email: string) => boolean;
	validUsername: (username: string) => boolean;
	signVerificationUrl: (url: string) => string;
	hasValidVerificationUrl: (url: string, query: verificationQuery) => string;
	validPassword: (password: string) => boolean;
	findByName: (username: string) => Promise<UserDocument> | null;
	findByEmail: (email: string) => Promise<UserDocument> | null;
}

export interface RememberMeModel extends Model<RememberMeDocument> {
	hashedToken: (token: string) => string;
	plaintextToken: () => string;
}

export interface PasswordResetModel extends Model<PasswordResetDocument> {
	plaintextToken: () => string;
	hashedToken: (token: string) => string;
}
