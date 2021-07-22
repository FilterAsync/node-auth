import nodemailer from "nodemailer";
import {
	SmtpOptions,
	MailFrom
} from "./config/index.mjs";
import * as dotenv from "dotenv";

const { env } = process;

if (env.NODE_ENV !== "production") {
	dotenv.config();
}

const transporter = nodemailer.createTransport(SmtpOptions)

export const sendMail = options => transporter.sendMail({
	...options,
	from: MailFrom,
});
