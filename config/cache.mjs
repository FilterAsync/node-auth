"use strict";

import * as dotenv from "dotenv";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";

const { env } = process;

if (env.NODE_ENV !== "production") {
	dotenv.config();
}

const RedisOptions = {
	port: +env.REDIS_PORT,
	host: env.REDIS_HOST,
	password: env.REDIS_PASSWORD,
}

const RedisStore = connectRedis(session);

const client = new Redis({ RedisOptions });

export const SessionStore = new RedisStore({ client: client });
