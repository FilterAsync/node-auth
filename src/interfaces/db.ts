import { Document, Types, Model } from "mongoose";

export interface IUser extends Document {
	_id: Types.ObjectId;
	username: string;
	email: string;
	visibleEmail: string;
	password: string;
	verifiedAt: number | Date | void;
	avatarUrl: string;
	createVerificationUrl: () => string;
	gravatar: (size: number) => Promise<string>;
	matchesPassword: (password: string) => Promise<string>;
}

export interface IRememberMe extends Document {
	_id: Types.ObjectId;
	credentials: {
		username: string;
		password: string;
	};
	token: string;
	expiresAt: Date;
}

export interface IPasswordReset extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	token: string;
	expiresAt: Date;
	isValidUrl: (ptt: string) => boolean;
	createResetPasswordUrl: (ptt: string) => string;
}

export interface RememberMeModel extends Model<IRememberMe> {
	hashedToken: (token: string) => string;
	plaintextToken: () => string;
}

export interface PasswordResetModel extends Model<IPasswordReset> {
	plaintextToken: () => string;
	hashedToken: (token: string) => string;
}

export interface UserModel extends Model<IUser> {
	matchesEmail: (email: string) => string;
	matchesUsername: (username: string) => boolean;
	signVerificationUrl: (url: string) => string;
	hasValidVerificationUrl: (url: string, query: any) => string;
}
