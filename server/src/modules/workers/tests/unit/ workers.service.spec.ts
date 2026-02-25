import { Test, TestingModule } from "@nestjs/testing";
import { WorkersService } from "../../workers.service";
import { PrismaService } from "../../../prisma/prisma.service";

// Mock Prisma client
const mockPrisma = {
  worker: {
    findMany: jest.fn(),
  },
};

describe("WorkersService", () => {
  let service: WorkersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WorkersService>(WorkersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return top 3 workers sorted by shifts and name", async () => {
    // Mock data
    mockPrisma.worker.findMany.mockResolvedValue([
      { id: 1, name: "Alice", status: 0, Shift: [{ id: 1 }, { id: 2 }] },
      { id: 2, name: "Bob", status: 0, Shift: [{ id: 3 }] },
      { id: 3, name: "Charlie", status: 0, Shift: [{ id: 4 }, { id: 5 }] },
      { id: 4, name: "Dave", status: 0, Shift: [{ id: 6 }] },
    ]);

    const result = await service.getTopWorkers();

    expect(result).toEqual([
      { id: 1, name: "Alice", shifts: 2 },
      { id: 3, name: "Charlie", shifts: 2 },
      { id: 2, name: "Bob", shifts: 1 },
    ]);
  });
});
