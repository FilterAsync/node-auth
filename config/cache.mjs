"use strict";

import * as dotenv from "dotenv";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import RedisRateLimitStore from "rate-limit-redis";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const RedisOptions = {
	port: +ENV.REDIS_PORT,
	host: ENV.REDIS_HOST,
	password: ENV.REDIS_PASSWORD,
}

const RedisSessionStore = connectRedis(session);

const client = new Redis(ENV.REDIS_HOST, RedisOptions);

export const SessionStore = new RedisSessionStore({ client: client, });

export const RateLimitStore = new RedisRateLimitStore({ client: client, });
