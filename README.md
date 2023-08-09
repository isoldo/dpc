# dpc
Delivery Price Calculator

## Instructions

### Running

The app is run by calling `npm start`. A server is listening to `http://localhost:3000`.
PostgreSQL database URL is defined in `.env` and defaults to `postgres://postgres@localhost:5432/postgres`.
Before running the app for the first time, run `npx prisma migrate reset` to drop everything in the database and perform migrations (populate the schema).
The database is now empty, but has the schema.

The only thing that needs to be done manually in the DB is to add a row in the `Admin` table.
Use the `email` field as the username and `password` field as the password to request a JWT which can be used to access other endpoints which require authentication.
Pass the JWT in the `authorization` header.

### Tests

Tests are run by calling `npm test`. This includes a set of API integration tests, which need to talk to a database.
The test database (`postgres://localhost:5433`) is reset before running the tests, so make sure that it is actually targeting the test database.
The integration tests call the `/api/delivery-request` endpoint which normally sends a confirmation email. This is omitted in the tests, due to the fact that this is a PoC and that I do not want to store sensitive data in a public repo (such as any valid email address).
The email is not sent by the endpoint handler if `SENDER_MAIL` is not defined (either in `.env` or as an actual environment variable).

## Features

- [x] admin login
- [x] admin can create a calculator
- [x] admin can update an existing calculator
- [x] anon user can submit request
- [x] anon user receives an email confirmation

### Extra

- [x] validate phone number
- [x] weekend tariff

## Deliverables

- [x] REST API (express, Typescript)
- [x] Database (PostgreSQL)
- [x] Documentation (Swagger)
- [x] Unit tests
- [x] Integration tests

### Extra

- [ ] Docker
