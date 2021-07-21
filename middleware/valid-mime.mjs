import { NotAcceptable } from "../errors/index.mjs";

export const validContentType = (mime = "application/json") => {
  return (req, res, next) => {
    if (!req.is(mime)) {
      res.status(406).send(`Not Acceptable: "${req.headers["Content-Type"]}"`);
      return next(new NotAcceptable());
    }
    next();
  };
};
