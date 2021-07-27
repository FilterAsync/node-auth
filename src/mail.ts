import { createTransport, SentMessageInfo } from "nodemailer";
import { SmtpOptions, MailFrom } from "./config";

const transporter = createTransport(SmtpOptions);

export const sendMail = (options: SentMessageInfo) =>
	transporter.sendMail({
		...options,
		from: MailFrom,
	});
