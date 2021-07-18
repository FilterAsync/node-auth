"use strict";

export const notFoundError = (req, res) => {
  res.status(404).json({
    status: 404,
    message: "Page Not Found",
  });
};

export const decodeUriError = (req, res, next) => {
  try {
    decodeURIComponent(req.path);
  } catch (e) {
    res.status(400).json({
      status: 400,
      message: "URI Error",
    });
    return;
  }
  next();
};

export const internalServerError = (err, _req, res, next) => {
  if (!err.status) {
    console.error(err.stack);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || "No message";

  res.status(statusCode).json({
    status: statusCode,
    message: message,
  });
  next();
};
