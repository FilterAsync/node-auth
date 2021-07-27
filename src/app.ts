import express, { ErrorRequestHandler } from "express";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import helmet from "helmet";
import methodOverride from "method-override";
import passport from "passport";
import { serializeUser, deserializeUser, localStrategy } from "./config";
import { login, register, home, resetPassword } from "./routes";
import { active, notFoundError, decodeUriError } from "./middleware";
import path from "path";
import morgan from "morgan";
import favicon from "serve-favicon";
import { sessionOptions } from "./config";
import flash from "express-flash";
import serveStatic from "serve-static";
import cookieParser from "cookie-parser";
import { SessionStore } from "./config/cache";
import { verify } from "./routes";

import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const createApp = async (errorHandler: ErrorRequestHandler) => {
	const app = express();

	app.engine("html", (await import("ejs")).renderFile);

	app.disable("x-powered-by"); // prevent specifically-targeted attacks

	app.set("views", [
		path.join(__dirname, "views"),
		path.join(__dirname, "views/errors"),
	]);
	app.set("view engine", "ejs");
	app.use(
		serveStatic(path.join(__dirname, "public"), {
			cacheControl: true,
			setHeaders: function (res, path) {
				const { mime } = serveStatic;

				if (mime.lookup(path).includes("/html")) {
					res.setHeader("Cache-Control", "public, max-age=0");
				}
			},
		})
	);

	app.use(favicon(path.join(__dirname, "public/img/favicon.ico")));
	app.use(flash());
	app.use(methodOverride("_method"));
	app.use(helmet());
	app.use(
		session({
			...sessionOptions,
			store: SessionStore,
		})
	);
	app.use(cookieParser(ENV.COOKIE_SECRET));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(active);

	passport.serializeUser(serializeUser);
	passport.deserializeUser(deserializeUser);
	passport.use(localStrategy);

	app.use(
		cors({
			origin: "*",
			methods: ["GET", "POST", "PUT", "DELETE"], // enumerate more if you want to...
			preflightContinue: false,
		}),
		morgan(function (tokens, req, res) {
			const contentLength = tokens.res(req, res, "Content-Length") || "None";

			return [
				tokens.method(req, res) + " method on",
				`"${tokens.url(req, res)}"`,
				"status: " + tokens.status(req, res),
				"content-length: " + contentLength,
				"-",
				tokens["response-time"](req, res),
				"ms.",
			].join(" ");
		}),
		compression(),
		(_, res, next) => {
			// Setting secure HTTP headers.

			res.set({
				/*
				Note: if you're about to add something about stylesheet/font/frame/url loaded script
				then you will need to enumerate it in the "Content-Security-Policy" property to stop logging CSP errors.
			*/
				"Content-Security-Policy":
					// -----------------------------------
					"default-src 'self';" +
					// for stylesheets
					"style-src 'self' 'unsafe-inline' https://use.fontawesome.com/ https://cdn.jsdelivr.net/npm/ " +
					"https://translate.googleapis.com/translate_static/css/translateelement.css;" +
					// for inline scripts (e.g. event handler) & url loaded scripts
					"script-src 'self' 'unsafe-inline' https://code.jquery.com/ https://www.googletagmanager.com/ " +
					"https://cdn.jsdelivr.net/npm/ https://cdnjs.cloudflare.com/ajax/libs/fetch/ " +
					"https://www.gstatic.com/recaptcha/releases/; " +
					// for url loaded script but not include inline scripts
					"script-src-elem 'self' 'unsafe-inline' https://code.jquery.com/ https://translate.googleapis.com/ " +
					"https://www.gstatic.com/recaptcha/releases/ https://cdn.jsdelivr.net/npm/ " +
					"https://www.google.com/recaptcha/api.js https://translate.google.com/ https://www.googletagmanager.com/;" +
					// for font loaded using css @font-face
					"font-src 'self' 'unsafe-inline' https://use.fontawesome.com/;" +
					// for nested browsing contexts (i.e. <frame>, <iframe>)
					"frame-src 'self' 'unsafe-inline' https://www.google.com/ https://www.googletagmanager.com/;" +
					// for valid sources of images and favicons
					"img-src 'self' 'unsafe-inline' data: 'unsafe-eval' 'unsafe-inline' https://gravatar.com/avatar/;",
				// -----------------------------------
				"X-XSS-Protection": "1; mode=block",
				"X-Frame-Options": "DENY",
				"X-Content-Type-Options": "nosniff",
			});
			next();
		}
	);

	// routes

	app.use(home, login, resetPassword, register, verify);

	// errors

	app.use(decodeUriError, notFoundError, errorHandler);

	return app;
};
