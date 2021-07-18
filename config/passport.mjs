"use strict";
import LocalStrategy from "passport-local"
import crypto from "crypto"
import { User } from "../models/user.mjs"

export const serializeUser = (user, done) => {
  done(null, user._id);
};

export const deserializeUser = (_id, done) => {
  User.findById(_id, (err, user) => {
    done(err, user);
  });
};

export const localStrategy = new LocalStrategy({
    usernameField: "eou",
  },
  async (eou, password, done) => {
    const EoU = User.matchesEmail(eou) 
      ? "email" : "username";

    eou = (EoU === "email") ? crypto
      .createHmac("sha1", eou)
      .digest("hex") : eou;
    User.findOne((EoU === "email") ? {
        email: eou,
      } : {
        username: eou,
      },
      async (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user || 
        !(await user.matchesPassword(password)) || 
        !user.verifiedAt) {
          return done(null, false);
        }
        return done(null, user);
      }
    );
  }
);
