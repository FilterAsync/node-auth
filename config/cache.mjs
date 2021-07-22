import * as dotenv from "dotenv";

const { env } = process;

if (env.NODE_ENV !== "production") {
	dotenv.config();
}

export const RedisOptions = {
	port: +env.REDIS_PORT,
	host: env.REDIS_HOST,
	password: env.REDIS_PASSWORD,
}
