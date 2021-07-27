import { SentMessageInfo } from "nodemailer";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const SmtpOptions: SentMessageInfo = {
	host: ENV.SMTP_HOST as string,
	port: +(ENV.SMTP_PORT as string),
	secure: true,
	auth: {
		user: ENV.BOT_EMAIL,
		pass: ENV.BOT_PASS,
	},
};

export const MailFrom = `noreply@${ENV.BOT_EMAIL}`;
