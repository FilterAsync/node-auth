import { Router } from "express";
import { User } from "../models/user";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

router.get("/", isAuthenticated, async (req, res) => {
	const user = await User.findById(req.session!.passport.user).select(
		"username visibleEmail avatarUrl"
	);
	res.render("index", { user: user });
});

router.get("/error", (req, res, next) => {
	throw new Error("aaa");
});

export { router as home };
