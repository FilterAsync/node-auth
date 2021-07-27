import { createApp } from "./app";
import mongoose from "mongoose";
import errorHandler from "errorhandler";
import { internalServerError } from "./middleware";
import * as dotenv from "dotenv";

const { env: ENV } = process;

if (ENV.NODE_ENV !== "production") {
	dotenv.config();
}

const PORT = +(ENV.PORT as string) || 8080;

const Prod = ENV.NODE_ENV === "production";

const mongodbConnection = Prod
	? (ENV.MONGODB_URI as string)
	: (ENV.MONGODB_URI_LOCAL as string);

(async function () {
	await mongoose.connect(mongodbConnection, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
		useCreateIndex: true,
	});
	console.log("MongoDB connection succeeded.");
	const server = await createApp(Prod ? internalServerError : errorHandler());
	server.listen(PORT, function () {
		console.log(
			"Server is running on PORT %d in %s mode.",
			PORT,
			server.get("env")
		);
	});
})();
