import { RequestHandler } from "express";
import { IUser } from "./interfaces/db";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const logOut: RequestHandler = (req, res, next): Promise<any> => {
	return new Promise((resolve, reject) => {
		req.session!.destroy((err) => {
			if (err) {
				reject(err);
				return next(err);
			}
			res.clearCookie(ENV.SESSION_NAME as string);
			resolve("Success");

			res.status(401).redirect("/login");
			next(new Error("Unauthenticated"));
		});
	});
};

export const markAsVerified = async (user: IUser) => {
	user.verifiedAt = Date.now();
	await user.save();
};

export const resetPassword = async (user: IUser, password: string) => {
	user.password = password;
	await user.save();
};
