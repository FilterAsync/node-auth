import { createApp } from "./app.mjs";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { SessionStore } from "./config/index.mjs";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const PORT = +ENV.PORT || 8080;

const Prod = ENV.NODE_ENV === "production";

(async function () {
	await mongoose.connect(Prod ? ENV.MONGODB_URI : ENV.MONGODB_URI_LOCAL, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
		useCreateIndex: true,
	});
	console.log("MongoDB connection succeeded.");
	const server = createApp(SessionStore);
	server.listen(PORT, function () {
		console.log(
			"Server is running on PORT %d in %s mode.",
			PORT,
			server.get("env")
		);
	});
})();
