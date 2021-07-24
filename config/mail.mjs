"use strict";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
  dotenv.config();
}

export const SmtpOptions = {
  host: ENV.SMTP_HOST,
  port: +ENV.SMTP_PORT,
  secure: true,
  auth: {
    user: ENV.BOT_EMAIL,
    pass: ENV.BOT_PASS,
  },
};

export const MailFrom = `noreply@${ENV.BOT_EMAIL}`;
