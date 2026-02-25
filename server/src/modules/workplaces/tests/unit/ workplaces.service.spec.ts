import { Test, TestingModule } from "@nestjs/testing";
import { WorkplacesService } from "../../workplaces.service";
import { PrismaService } from "../../../prisma/prisma.service";

// Mock Prisma client
const mockPrisma = {
  workplace: {
    findMany: jest.fn(),
  },
};

describe("WorkplacesService", () => {
  let service: WorkplacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkplacesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WorkplacesService>(WorkplacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return top 3 workplaces sorted by shifts and latest shift", async () => {
    const now = new Date();

    mockPrisma.workplace.findMany.mockResolvedValue([
      {
        id: 1,
        name: "XCorp",
        status: 0,
        shifts: [{ id: 1, endAt: new Date(now.getTime() - 1000) }],
      },
      {
        id: 2,
        name: "AlphaInc",
        status: 0,
        shifts: [
          { id: 2, endAt: new Date(now.getTime() - 500) },
          { id: 3, endAt: new Date(now.getTime() - 1000) },
        ],
      },
      {
        id: 3,
        name: "BetaLLC",
        status: 0,
        shifts: [{ id: 4, endAt: new Date(now.getTime() - 1500) }],
      },
    ]);

    const result = await service.getTopWorkplaces();

    expect(result).toEqual([
      { id: 2, name: "AlphaInc", shifts: 2 },
      { id: 1, name: "XCorp", shifts: 1 },
      { id: 3, name: "BetaLLC", shifts: 1 },
    ]);
  });
});
