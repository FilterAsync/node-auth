import nodemailer from "nodemailer";
import { SmtpOptions, MailFrom } from "./config/index.mjs";

const transporter = nodemailer.createTransport(SmtpOptions);

export const sendMail = (options) =>
	transporter.sendMail({
		...options,
		from: MailFrom,
	});
