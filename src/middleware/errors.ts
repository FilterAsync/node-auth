import { RequestHandler, ErrorRequestHandler } from "express";

export const notFoundError: RequestHandler = (_, res, __) => {
	res.status(404).render("404");
};

export const decodeUriError: RequestHandler = (req, res, next) => {
	try {
		decodeURIComponent(req.path);
	} catch (e) {
		res.status(400).render("404");
		return;
	}
	next();
};

export const internalServerError: ErrorRequestHandler = (err, _, res, next) => {
	console.error(err.stack);

	res.status(500).render("500");
	next();
};
