"use strict";

export const notFoundError = (_req, res) => {
  res.status(404).render("404");
};

export const decodeUriError = (req, res, next) => {
  try {
    decodeURIComponent(req.path);
  } catch (e) {
    res.status(400).render("404");
    return;
  }
  next();
};

export const internalServerError = (err, _req, res, next) => {
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
