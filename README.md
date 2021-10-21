# Node Authentication

An authentication boilerplate with security and scalability in mind.

## Prerequisites
- `node` and `npm`
- MongoDB and Redis installed

## Features
- Login, register, logout
- Email verification
- Password reset
- Rate limiting

## API
| Method        | URI             | Authorization |
| ------------- | --------------- | ------------- |
| GET/POST      | /login          | logged out    |
| GET/POST      | /register       | logged out    |
| GET           | /               | logged in     |
| GET           | /email/verify   | logged out    |
| POST          | /email/resend   | logged out    |
| GET/POST      | /reset-password | logged out    |
| GET/POST      | /password/reset | logged out    |
