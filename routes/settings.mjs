"use strict";
import express from "express"
import { User } from "../models/user.mjs"
import crypto from "crypto"
import {
    isAuthenticated
} from "../middleware/auth.mjs"
import { 
    validContentType
} from "../middleware/valid-mime.mjs"
import catchAsync from "express-async-handler"
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

router.get("/settings", isAuthenticated, (req, res) => {
    const user = req.user;
    res.render("settings", { 
        user: user, 
    });
});

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post(
    "/settings/change-password",
    isAuthenticated,
    validContentType(),
    async (req, res) => {
    const { user } = req;
    const { 
        currentPassword, 
        newPassword, 
        confirmPassword,
    } = req.body;
    if (currentPassword.length < 8 || confirmPassword.length < 8) {
        res.status(400).json({
            message: "Password(s) must be at least 8 characters."
        });
        return;
    }
    if (confirmPassword !== newPassword) {
        res.status(400).json({
            message: "Confirm password does not match."
        });
        return;
    }
    if (await user.matchesPassword(currentPassword)) {
        user.password = await bcrypt.hash(newPassword, +env.BCRYPT_SALT);
        user.save();
        res.status(200).json({
            message: "Successfully changed password."
        });
        return;
    }
    res.status(400).json({
        message: "Password(s) does not match."
    });
});

export { router as settings };
