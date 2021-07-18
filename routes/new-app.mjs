"use strict";
import express from "express"
import {
    isAuthenticated
} from "../middleware/auth.mjs";

const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
    strict: true,
});

router.get("/new-app", isAuthenticated, (req, res) => 
    res.render("new-app", { user: req.user })
);

export { router as newApp }
