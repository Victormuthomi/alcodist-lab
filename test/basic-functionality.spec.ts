import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../server/src/app.module";

describe("Top Endpoints (CI/CD)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should get top workers successfully", async () => {
    const res = await request(app.getHttpServer()).get("/workers/top");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    res.body.forEach((worker: any) => {
      expect(worker).toHaveProperty("id");
      expect(worker).toHaveProperty("name");
      expect(worker).toHaveProperty("shifts");
    });
  });

  it("should get top workplaces successfully", async () => {
    const res = await request(app.getHttpServer()).get("/workplaces/top");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    res.body.forEach((wp: any) => {
      expect(wp).toHaveProperty("id");
      expect(wp).toHaveProperty("name");
      expect(wp).toHaveProperty("shifts");
    });
  });
});
