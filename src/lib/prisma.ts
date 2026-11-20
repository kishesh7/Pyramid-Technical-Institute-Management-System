
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const isTiDB = Boolean(process.env.TIDB_HOST);

let adapter: PrismaMariaDb;

if (isTiDB) {
  // Production: TiDB Cloud
  const requiredVariables = [
    "TIDB_HOST",
    "TIDB_PORT",
    "TIDB_USER",
    "TIDB_PASSWORD",
    "TIDB_DATABASE",
  ] as const;

  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      throw new Error(`${variable} is not configured`);
    }
  }

  adapter = new PrismaMariaDb({
    host: process.env.TIDB_HOST!,
    port: Number(process.env.TIDB_PORT),
    user: process.env.TIDB_USER!,
    password: process.env.TIDB_PASSWORD!,
    database: process.env.TIDB_DATABASE!,
    connectionLimit: 5,
    ssl: {
      rejectUnauthorized: true,
    },
  });
} else {
  // Local development: Laragon MySQL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const url = new URL(databaseUrl);

  adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
