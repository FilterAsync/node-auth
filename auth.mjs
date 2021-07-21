import * as dotenv from "dotenv";
import * as bcrypt from "bcrypt";

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

export const logOut = (req, res, redirect = "/login") => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }
      res.clearCookie(env.SESSION_NAME);
      resolve("Success");
      res.status(401).redirect(redirect);
    });
  });
};

export const markAsVerified = async (user) => {
  user.verifiedAt = Date.now();
  await user.save();
};

export const resetPassword = async (user, password) => {
  user.password = await bcrypt.hash(password, +env.BCRYPT_SALT);
  await user.save();
};
