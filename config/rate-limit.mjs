"use strict";

import { RateLimitStore } from "./index.mjs"

export const rateLimitInit = (options) => {
	return {
		store: RateLimitStore,
		headers: true,
		...options,
	}
}
