import { Strategy as LocalStrategy } from "passport-local";
import crypto from "crypto";
import { User } from "../models/user";
import { IUser } from "../interfaces/db";
import { NativeError } from "mongoose";

export const serializeUser = (user: any, done: any) => {
	done(null, user._id);
};

export const deserializeUser = (_id: string, done: any) => {
	User.findById(_id, (err: NativeError, user: IUser) => {
		done(err, user);
	});
};

export const localStrategy = new LocalStrategy(
	{
		usernameField: "eou",
	},
	(eou, password, done) => {
		const EoU = User.matchesEmail(eou) ? "email" : "username";

		eou = EoU === "email" ? crypto.createHmac("sha1", eou).digest("hex") : eou;
		User.findOne(
			EoU === "email"
				? {
						email: eou,
				  }
				: {
						username: eou,
				  },
			async (err: NativeError, user: IUser) => {
				if (err) {
					return done(err);
				}
				if (!user || !user.matchesPassword(password) || !user.verifiedAt) {
					return done(null, false);
				}
				return done(null, user);
			}
		);
	}
);
