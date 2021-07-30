import crypto, { BinaryToTextEncoding } from "crypto";
import { hash, compare } from "bcrypt";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const sha256 = (value: string, encoding: BinaryToTextEncoding): string =>
	crypto.createHash("sha256").update(value).digest(encoding);

export const pwsdHash = (pwsd: string) =>
	hash(sha256(pwsd, "base64"), +(ENV.BCRYPT_SALT as string));

export const comparePwsd = (pwsd: string, hash: string) =>
	compare(sha256(pwsd, "base64"), hash);
