import { PrismaClient } from "@prisma/client";

import env from "@/lib/config/env";

declare global {
  var __interDailyPrisma: PrismaClient | undefined;
}

export const prisma =
  env.databaseUrl === ""
    ? null
    : global.__interDailyPrisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
      });

if (prisma && process.env.NODE_ENV !== "production") {
  global.__interDailyPrisma = prisma;
}
