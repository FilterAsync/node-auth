import { IUser } from "../interfaces/db";

export const message = (user: IUser, verifyLink: string) => {
	return `
    <h4>Hello ${user.username},</h4>
    <p>
      We're happy you signed up.
      <br />
      To start exploring the app, please confirm your email address by clicking the link below.
    </p>
    <a href="${verifyLink}" target="_blank">
      Verification
    </a>
    <br />
    <br />
    <small>
      This verification link will expire in 12 hours.
    </small>
    `;
};
