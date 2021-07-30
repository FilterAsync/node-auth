import express from "express";
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
import { Store as SessionStore } from "./config/cache";
import { verify } from "./routes";
import errorHandler from "errorhandler";
import { internalServerError } from "./middleware";

import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const Prod = ENV.NODE_ENV === "production";

const app = express();

(async function () {
	app.engine("html", (await import("ejs")).renderFile);
})();

app.disable("x-powered-by"); // prevent specifically-targeted attacks

app.set("views", [
	path.join(__dirname, "views"),
	path.join(__dirname, "views/errors"),
]);
app.set("view engine", "ejs");
app.use(
	serveStatic(path.join(__dirname, "public"), {
		// maxAge: 86400

		cacheControl: false,
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

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);
passport.use(localStrategy);

app.use(cors());

app.use(
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
	(_, res, next) => {
		// Setting secure HTTP headers.

		res.set({
			/*
			Note if you're about to add something that is stylesheet/font/frame/manifest/url loaded script
			then you will need to enumerate it in the "Content-Security-Policy" property to stop logging CSP errors.

			see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
		*/
			"Content-Security-Policy":
				// allow content from the current origin
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
				"img-src 'self' 'unsafe-inline' data: 'unsafe-eval' 'unsafe-inline' https://gravatar.com/avatar/ " +
				"https://www.gstatic.com;" +
				// for the URLS which can be loaded using script interfaces
				"connect-src 'self' 'unsafe-inline' https://translate.googleapis.com;",
		});
		next();
	}
);

// middleware

app.use(compression(), active);

// routes

app.use(home, login, resetPassword, register, verify);

// errors

app.use(
	decodeUriError,
	notFoundError,
	Prod ? internalServerError : errorHandler()
);

export default app;
