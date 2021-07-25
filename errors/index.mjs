export class Unauthorized extends Error {
	constructor(message = "Unauthorized") {
		super(message);
		this.statusCode = 401;
	}
}

export class BadRequest extends Error {
	constructor(message = "Bad request") {
		super(message);
		this.statusCode = 400;
	}
}

export class NotAcceptable extends Error {
	constructor(message = "Invalid content-type") {
		super(message);
		this.statusCode = 406;
	}
}
