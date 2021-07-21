import * as dotenv from "dotenv";

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

export const SmtpOptions = {
  host: env.SMTP_HOST,
  port: +env.SMTP_PORT,
  secure: true,
  auth: {
    user: env.BOT_EMAIL,
    pass: env.BOT_PASS,
  },
};

export const MailFrom = `noreply@${env.BOT_EMAIL}`;
