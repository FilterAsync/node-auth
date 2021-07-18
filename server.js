"use strict";
import app from "./app.mjs"
import * as dotenv from "dotenv"

const { env } = process;

if (env.NODE_ENV !== "production") {
    dotenv.config();
}

const PORT = +env.PORT || 3000;

app.listen(PORT, function() {
    console.log(
        "Server is running on PORT %d in %s mode.",
        PORT,
        app.get("env"),
    );
});
