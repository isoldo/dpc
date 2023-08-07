import { listener } from "../index.js";
import request from "supertest";

let server;

beforeAll(() => {
  server = listener;
});

afterAll(async () => {
  await server.close(); // Close the server after all tests are complete
});

describe("Check the health API", () =>
  {
    it('should respond with status 200 and body { status: "ALIVE" } to a GET request',
      async () => {
        const response = await request(server).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ALIVE" });
      }
    );
    it('should respond with status 200 and body { status: "ALIVE" } to a POST request',
      async () => {
        const response = await request(server).post('/api/health').send({});
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ALIVE" });
      }
    );
  }
);
