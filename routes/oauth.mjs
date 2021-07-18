"use strict";
import express from "express"
import { User } from "../models/user.mjs"
import crypto from "crypto"

const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
    strict: true,
});

router.post("/oauth", async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    let emailHash = crypto
        .createHmac("sha1", email)
        .digest("hex");
    const user = await User.findOne({ email: emailHash });
    if (!user) {
        res.sendStatus(409);
        return;
    }
    if (await user.matchesPassword(password)) {
        console.log(req.isAuthenticated());
        res.sendStatus(200);
        return;
    }
    res.sendStatus(400);
});

export { router as oauth };
