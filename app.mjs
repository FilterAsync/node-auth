import express from "express";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import helmet from "helmet";
import methodOverride from "method-override";
import passport from "passport";
import {
	serializeUser,
	deserializeUser,
	localStrategy,
} from "./config/index.mjs";
import { login, register, home, resetPassword } from "./routes/index.mjs";
import {
	active,
	notFoundError,
	decodeUriError,
	internalServerError,
} from "./middleware/index.mjs";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import favicon from "serve-favicon";
import { sessionOptions } from "./config/index.mjs";
import flash from "express-flash";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const createApp = (store) => {
	const app = express();

	app.set("views", [
		path.join(__dirname, "views"),
		path.join(__dirname, "views/errors"),
	]);
	app.set("view engine", "ejs");
	app.use("/public", express.static(path.join(__dirname, "public")));
	app.use(favicon(path.join(__dirname, "public/img/favicon.ico")));
	app.use(flash());
	app.use(methodOverride("_method"));
	app.use(helmet());
	app.use(session({ ...sessionOptions, store }));
	app.use(cookieParser(ENV.COOKIE_SECRET));
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser(serializeUser);
	passport.deserializeUser(deserializeUser);
	passport.use(localStrategy);

	app.use(
		cors({
			origin: "*",
			methods: ["GET", "POST", "PUT", "DELETE"], // enumerate more if you want to...
			preflightContinue: false,
		})
	);

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
		})
	);

	app.use(compression());

	app.use((_req, res, next) => {
		// Setting secure HTTP headers (used to block against attackers).

		res.set({
			/*	Note: if you're about to add something about stylesheet/font/frame/script source
					then you will need to enumerate it in the "Content-Security-Policy" property to stop logging CSP errors.
			*/
			"Content-Security-Policy":
			// -----------------------------------
				"default-src 'self';"
				/* for stylesheets */
				+ "style-src 'self' 'unsafe-inline' https://use.fontawesome.com/ https://cdn.jsdelivr.net/npm/ https://translate.googleapis.com/translate_static/css/translateelement.css;"
				/* for inline scripts (e.g. event handler) & url loaded scripts */
				+ "script-src 'self' 'unsafe-inline' https://code.jquery.com/ https://www.googletagmanager.com/ https://cdn.jsdelivr.net/npm/ https://cdnjs.cloudflare.com/ajax/libs/fetch/ https://www.gstatic.com/recaptcha/releases/;"
				/* for url loaded script but not include inline scripts */
				+ "script-src-elem 'self' 'unsafe-inline' https://code.jquery.com/ https://translate.googleapis.com/ https://www.gstatic.com/recaptcha/releases/ https://cdn.jsdelivr.net/npm/ https://www.google.com/recaptcha/api.js https://translate.google.com/ https://www.googletagmanager.com/;"
				/* for font loaded using css @font-face */
				+ "font-src 'self' 'unsafe-inline' https://use.fontawesome.com/;"
			 	/* for nested browsing contexts (i.e. <frame>, <iframe>) */
				+ "frame-src 'self' 'unsafe-inline' https://www.google.com/ https://www.googletagmanager.com/; img-src 'self' 'unsafe-inline' data: 'unsafe-eval' 'unsafe-inline' https://gravatar.com/avatar/;",
			// -----------------------------------
			"X-XSS-Protection": "1; mode=block",
			"X-Frame-Options": "DENY",
			"X-Content-Type-Options": "nosniff",
		});
		next();
	});

	app.use(active);

	app.use(home);

	app.use(login);

	app.use(resetPassword);

	app.use(register);

	app.use(decodeUriError);

	app.use(notFoundError);

	app.use(internalServerError);

	return app;
};
