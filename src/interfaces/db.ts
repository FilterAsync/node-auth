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
	gravatar: (size: number) => Promise<any>;
	matchesPassword: (password: string) => Promise<boolean>;
}

export interface RememberMeDocument extends Document {
	credentials: {
		username: string;
		password: string;
	};
	token: string;
	expiresAt: Date;
}

export interface PasswordResetDocument extends Document {
	userId: Types.ObjectId;
	token: string;
	expiresAt: Date;
	isValidUrl: (ptt: string) => boolean;
	createResetPasswordUrl: (ptt: string) => string;
}

export interface UserModel extends Model<UserDocument> {
	matchesEmail: (email: string) => string;
	matchesUsername: (username: string) => boolean;
	signVerificationUrl: (url: string) => string;
	hasValidVerificationUrl: (url: string, query: verificationQuery) => string;
}

export interface RememberMeModel extends Model<RememberMeDocument> {
	hashedToken: (token: string) => string;
	plaintextToken: () => string;
}

export interface PasswordResetModel extends Model<PasswordResetDocument> {
	plaintextToken: () => string;
	hashedToken: (token: string) => string;
}
