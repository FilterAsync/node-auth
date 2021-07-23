import * as bcrypt from "bcrypt";

console.log(
	await bcrypt.compare("eminem39393@yahoo.com", "$2b$10$GC0NoALy0KoBrP8gqKmOIOHUC47jm8xYxO49OXwlogk/RsM5PhJ.a")
)
