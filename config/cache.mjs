import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const Prod = ENV.NODE_ENV === "production";

const RedisPort = Prod ? +ENV.REDIS_PORT : +ENV.REDIS_PORT_LOCAL;
const RedisHost = Prod ? ENV.REDIS_HOST : ENV.REDIS_HOST_LOCAL;
const RedisPassword = Prod ? ENV.REDIS_PASSWORD : ENV.REDIS_PASSWORD_LOCAL;

const RedisOptions = {
	port: RedisPort,
	host: RedisHost,
	password: RedisPassword,
};

const RedisSessionStore = connectRedis(session);

export const client = new Redis(RedisHost, RedisOptions);

export const SessionStore = new RedisSessionStore({ client: client });
