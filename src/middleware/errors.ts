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
	if (!err.status) {
		console.error(err.stack);
	}
	const statusCode = err.statusCode || 500;
	const message = err.message || "Internal Server Error";

	res.status(statusCode).json({
		status: statusCode,
		message: message,
	});
	next();
};
