"use strict";
import express from "express"
import { 
  User
} from "../models/user.mjs"
import crypto from "crypto"
import { 
  sendMail
} from "../mail.mjs"
import {
  validContentType
} from "../middleware/valid-mime.mjs"
import {
  isUnauthenticated
} from "../middleware/auth.mjs"
import {
  markAsVerified
} from "../auth.mjs"
import * as bcrypt from "bcrypt"
import * as dotenv from "dotenv"

const { env } = process;

if (env.NODE_ENV !== "production") {
  dotenv.config();
}

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true,
});

router.get("/register", isUnauthenticated, (req, res) => 
  res.render("register"));

router.get(
  "/register/emailVerifyStep",
  isUnauthenticated,
  async (req, res) => {
    const { email } = req.query;
    const user = await User.findOne({ email: email }).select("username visibleEmail");
    if (!user) {
      res.status(404).json({
        message: "Page not found",
        status: "404"
      });
      return;
    }
    if (user.verifiedAt) {
      res.status(404).json({
        message: "Page not found",
        status: "404",
      });
      return;
    }
    res.render("email-verify-step", {
      user: user
    });
  }
);

router.get(
  "/email/verify",
  isUnauthenticated,
  async (req, res) => {
    const { id, token, expires, signature } = req.query;
    if (!id || !token || !expires || !signature) {
      res.status(404).json({
        message: "Page Not Found",
        status: "404"
      });
      return;
    }
    const user = await User.findById(id);

    if (!user || !User.hasValidVerificationUrl(req.originalUrl, req.query)) {
      res.status(400).json({
        message: "Invalid activation link.",
        status: "404",
      });
      return;
    }

    if (user.verifiedAt) {
      res.status(400).json({
        message: "Email already verified.",
        status: "400",
      });
      return;
    }

    await markAsVerified(user);
    req.login(user, err => {
      if (err) {
        throw err;
      }
      return res.status(200).redirect("/");
    });
  }
);

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post(
  "/register",
  isUnauthenticated,
  validContentType(),
  async (req, res) => {
  const { username, email, password } = req.body;
  if (
    !User.matchesUsername(username) ||
    !User.matchesEmail(email) ||
    !password || password?.length < 8
  ) {
    console.log(User.matchesUsername(username), User.matchesEmail(email), password.length < 8);
    res.status(400).json({
      message: "Failed to register.",
    });
    return;
  }
  const usernameExists = await User.exists({ username: username });
  const emailExists = await User.exists({ email: email });
  if (usernameExists || emailExists) {
    res.status(409).json({
      message: "Username or email was taken.",
    });
    return;
  }
  const passwordHash = await bcrypt.hash(password, +env.BCRYPT_SALT);
  const emailHash = crypto
    .createHmac("sha1", email)
    .digest("hex");

  const user = new User({
    username: username,
    email: emailHash,
    visibleEmail: email,
    password: passwordHash,
    apps: {
      total: 0,
      favorites: [],
      creations: [],
    },
    verifiedAt: null,
  });
  user.avatarUrl = await user.gravatar(96);
  user.save();

  const verifyLink = user.createVerificationUrl();

  await sendMail({
    subject: "Email verification",
    html: `
    <h4>Hello,</h4>
    <p>
      We're happy you signed up. 
      <br />
      To start exploring the app, please confirm your email address by clicking the link below.
    </p>
    <a href="${verifyLink}" target="_blank">
      Verification
    </a>
    <br />
    <br />
    <small>
      Did you receive this email without signing up?
      <a href="${env.APP_ORIGIN}">Click here</a>.
      <br />
      This verification link will expire in 12 hours.
    </small>
    `,
    to: user.visibleEmail,
  });

  res.status(200).json({
    vlink: "/register/emailVerifyStep?email=" + user.email
  });
});

router.post(
  "/available",
  isUnauthenticated,
  async (req, res) => {
    const field = req.query?.field || "username";
    const value = req.query.value || "";
    res.status(200).json({
      wasTaken: await User.exists(field === "username"
        ? {
          username: value
      } : {
          email: value
        }
      )
    });
  }
);

export { router as register };
