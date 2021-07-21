"use strict";
import express from "express";
import { User } from "../models/user.mjs";
import { isAuthenticated } from "../middleware/auth.mjs";
import catchAsync from "express-async-handler";

const router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true,
});

router.get("/", isAuthenticated, catchAsync(async (req, res) => {
  const user = await User.findById(req.session.passport.user).select(
    "username visibleEmail avatarUrl"
  );
  res.render("index", { user: user });
}));

export { router as home };
