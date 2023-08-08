import { PrismaClient } from "@prisma/client";
import { listener } from "../index.js";
import request from "supertest";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";

let server;
const email = "dummy@admin.mail";
const pw = "password";
let token: string;
const wrongToken = jwt.sign({ isAdmin: true }, "wrongKey" );

const urls = {
  health: "/api/health",
  login: "/api/admin/login",
  fixed: "/api/admin/prices/fixed",
  variable: "/api/admin/prices/variable"
};

beforeAll(async () => {
  server = listener;
  const prismaClient = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL} } });
  const passwordHash = createHash("sha256").update(pw, "ascii").digest().toString("hex");
  const admin = await prismaClient.admin.create({ data: { email, passwordHash }});
  console.log({ url: process.env.DATABASE_URL, admin });
});

afterAll(async () => {
  await server.close(); // Close the server after all tests are complete
});

describe("Check the health API", () =>
  {
    const get = async () => request(server).get(urls.health);
    const post = async () => request(server).post(urls.health).send({});
    it('should respond with status 200 and body { status: "ALIVE" } to a GET request',
      async () => {
        const response = await get();
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ALIVE" });
      }
    );
    it('should respond with status 200 and body { status: "ALIVE" } to a POST request',
      async () => {
        const response = await post();
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ALIVE" });
      }
    );
  }
);

describe("Check admin login API", () =>
  {
    const login = async (params: {un?: string, pw?: string}) => request(server).post(urls.login).send({ ...params });
    it("should return 400 for missing email",
      async () => {
        const response = await login({ pw: "dont-care" });;
        expect(response.status).toBe(400);
      }
    );
    it("should return 400 for missing password",
      async () => {
        const response = await login({ un: "dont-care" });
        expect(response.status).toBe(400);
      }
    );
    it("should return 401 for a non-existing admin",
      async () => {
        const response = await login({ un: "dont-exist@corp.com", pw});
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for a wrong password",
      async () => {
        const response = await login({ un: email, pw: "wrongpass"});
        expect(response.status).toBe(401);
      }
    );
    it("should return a verifiable JWT for an existing admin",
      async () => {
        const response = await login({ un: email, pw});
        token = response.body.token;
        const verifiedToken = jwt.verify(token, (process.env.SECRET_KEY as string)) as jwt.JwtPayload;
        const isAdmin = verifiedToken.isAdmin;
        expect(response.status).toBe(200);
        expect(isAdmin).toBe(true);
      }
    );
  }
);

describe("Check admin API authorization", () =>
  {
    const getAuth = async (url: string, token: string) => request(server).get(url).set("authorization", token);
    const putAuth = async (url: string, token: string, body: Object) =>
      request(server).get(url).set("authorization", token).send(body);
    const getAnon = async (url: string) => request(server).get(url);
    const putAnon = async (url: string, body: Object) => request(server).get(url).send(body);
    it("should return 401 for GET fixed prices with no token",
      async () => {
        const response = await getAnon(urls.fixed);
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for GET fixed prices with a wrong token",
      async () => {
        const response = await getAuth(urls.fixed, wrongToken);
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for PUT fixed prices with no token",
      async () => {
        const response = await putAnon(urls.fixed,{});
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for PUT fixed prices with a wrong token",
      async () => {
        const response = await putAuth(urls.fixed, wrongToken, {});
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for GET variable prices with no token",
      async () => {
        const response = await getAnon(urls.variable);
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for GET variable prices with a wrong token",
      async () => {
        const response = await getAuth(urls.variable, wrongToken);
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for PUT variable prices with no token",
      async () => {
        const response = await putAnon(urls.variable, {});
        expect(response.status).toBe(401);
      }
    );
    it("should return 401 for PUT variable prices with a wrong token",
      async () => {
        const response = await putAuth(urls.variable, wrongToken, {});
        expect(response.status).toBe(401);
      }
    );
  }
);

describe("Check the fixed prices API", () =>
  {
    const get = async () => request(server).get(urls.fixed).set("authorization", token);
    const put = async (params: { base?: number, additionalPackage?: number}) =>
      request(server).put(urls.fixed).set("authorization", token).send({ ...params });
    const fixedPrices1 = {
      base: 2,
      additionalPackage: 0.25
    };
    const fixedPrices2 = {
      base: 3,
      additionalPackage: 0.75
    };
    it("should return 404 for GET fixed prices when DB is empty",
      async () => {
        const response = await get();
        expect(response.status).toBe(404);
      }
    );
    it("should return 200 for PUT fixed prices when DB is empty",
      async () => {
        const response = await put(fixedPrices1);
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual({ ...fixedPrices1, active: true, id: 1});
      }
    );
    it("should return 200 and the correct values for GET fixed prices",
      async () => {
        const response = await get();
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual({ ...fixedPrices1, active: true, id: 1});
      }
    );
    it("should return 200 for PUT fixed prices when DB is not empty and id should be 2",
      async () => {
        const response = await put(fixedPrices2);
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual({ ...fixedPrices2, active: true, id: 2});
      }
    );
    it("should return 200 and the correct updated values for GET fixed prices",
      async () => {
        const response = await get();
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual({ ...fixedPrices2, active: true, id: 2});
      }
    );
    it("should return 400 for PUT fixed prices with missing additionalPackage cost param",
      async () => {
        const response = await put({ base: 4 });
        expect(response.status).toBe(400);
      }
    );
    it("should return 400 for PUT fixed prices with missing base price param",
      async () => {
        const response = await put({ additionalPackage: 4 });
        expect(response.status).toBe(400);
      }
    );
  }
);
