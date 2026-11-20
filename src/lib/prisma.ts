
import "server-only";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// Read the TiDB Cloud connection URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

// Parse database connection details
const dbUrl = new URL(databaseUrl);
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(
  dbUrl.hostname
);
const useSsl = !isLocalDatabase;

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port || 3306),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ""),
  ssl: useSsl,
  connectionLimit: 5,
});

// Reuse one Prisma Client instance during development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionKey: string | undefined;
};

export const prisma =
  globalForPrisma.prisma &&
  globalForPrisma.prismaConnectionKey === `${databaseUrl}:${useSsl}`
    ? globalForPrisma.prisma
    : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConnectionKey = `${databaseUrl}:${useSsl}`;
}
