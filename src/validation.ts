import mongoose from "mongoose";
import _Joi, { ExtensionFactory, Root, StringSchema } from "@hapi/joi";

const objectId: ExtensionFactory = (Joi) => ({
	type: "objectId",
	base: Joi.string(),
	messages: {
		objectId: '"{#label}" is not a valid objectId.',
	},
	validate(value, helpers) {
		if (!mongoose.Types.ObjectId.isValid(value)) {
			return {
				value,
				errors: helpers.error("objectId"),
			};
		}
	},
});

interface ExtendedRoot extends Root {
	objectId(): StringSchema;
}

export const Joi: ExtendedRoot = _Joi.extend(objectId);

export const emailVerificationSchema = Joi.object().keys({
	id: Joi.objectId().required(),
	expires: Joi.date().timestamp().raw().required(),
	token: Joi.string().length(40).hex().required(),
	signature: Joi.string().length(64).hex().required(),
});

export const emailVerifyStepSchema = Joi.object().keys({
	email: Joi.string().length(40).hex().required(),
	expires: Joi.date().timestamp().raw().required(),
});

export const pwsdResetSchema = Joi.object().keys({
	id: Joi.objectId().required(),
	token: Joi.string().length(160).hex().required(),
});
