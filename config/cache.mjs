"use strict";

import * as dotenv from "dotenv";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import RedisRateLimitStore from "rate-limit-redis";

const { env } = process;

if (env.NODE_ENV !== "production") {
	dotenv.config();
}

const RedisOptions = {
	port: +env.REDIS_PORT,
	host: env.REDIS_HOST,
	password: env.REDIS_PASSWORD,
}

const RedisSessionStore = connectRedis(session);

const client = new Redis(env.REDIS_HOST, RedisOptions);

export const SessionStore = new RedisSessionStore({ client: client, });

export const RateLimitStore = new RedisRateLimitStore({ client: client, });
