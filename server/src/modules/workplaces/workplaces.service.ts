import { Injectable } from "@nestjs/common";
import { type Workplace } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { getNextPage, queryParameters } from "../shared/pagination";
import { Page, PaginatedData } from "../shared/shared.types";
import { CreateWorkplace } from "./workplaces.schemas";

@Injectable()
export class WorkplacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWorkplace): Promise<Workplace> {
    return await this.prisma.workplace.create({ data });
  }

  async getById(id: number): Promise<Workplace | null> {
    return await this.prisma.workplace.findUnique({ where: { id } });
  }

  async get(parameters: { page: Page }): Promise<PaginatedData<Workplace>> {
    const { page } = parameters;
    const databaseQueryParameters = queryParameters({ page });

    const workplaces = await this.prisma.workplace.findMany({
      ...databaseQueryParameters,
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.workplace,
    });

    return { data: workplaces, nextPage };
  }

  async getTopWorkplaces(): Promise<{ id: number; name: string; shifts: number }[]> {
    const now = new Date();

    // Fetch active workplaces with completed shifts
    const workplaces = await this.prisma.workplace.findMany({
      where: { status: 0 },
      select: {
        id: true,
        name: true,
        shifts: {
          where: {
            cancelledAt: null,
            endAt: { lt: now },
          },
          select: {
            id: true,
            endAt: true, // needed for tie-break
          },
        },
      },
    });

    // Map to {id, name, shifts, latestShift} and sort
    const sortedWorkplaces = workplaces
      .map((wp) => ({
        id: wp.id,
        name: wp.name,
        shifts: wp.shifts.length,
        latestShift: wp.shifts.reduce(
          (latest, shift) => {
            return !latest || shift.endAt > latest ? shift.endAt : latest;
          },
          null as Date | null,
        ),
      }))
      .sort((a, b) => {
        if (b.shifts !== a.shifts) return b.shifts - a.shifts; // primary: completed shifts
        // tie-breaker: latest completed shift
        if (b.latestShift && a.latestShift) {
          return b.latestShift.getTime() - a.latestShift.getTime();
        }
        return 0;
      })
      .slice(0, 3)
      .map(({ id, name, shifts }) => ({ id, name, shifts })); // remove latestShift for final output

    return sortedWorkplaces;
  }
}
