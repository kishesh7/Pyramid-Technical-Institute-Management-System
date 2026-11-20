
import "server-only";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const isTiDB = Boolean(process.env.TIDB_HOST);
let adapter: PrismaMariaDb;
let connectionKey: string;

if (isTiDB) {
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
    ssl: { rejectUnauthorized: true },
    connectionLimit: 5,
  });
  connectionKey = `tidb:${process.env.TIDB_HOST}:${process.env.TIDB_PORT}:${process.env.TIDB_USER}:${process.env.TIDB_DATABASE}`;
} else {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const dbUrl = new URL(databaseUrl);
  const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(
    dbUrl.hostname
  );
  const useSsl = !isLocalDatabase;

  adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 3306),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ""),
    ssl: useSsl,
    connectionLimit: 5,
  });
  connectionKey = `url:${databaseUrl}:${useSsl}`;
}

// Reuse one Prisma Client instance during development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionKey: string | undefined;
};

export const prisma =
  globalForPrisma.prisma &&
  globalForPrisma.prismaConnectionKey === connectionKey
    ? globalForPrisma.prisma
    : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConnectionKey = connectionKey;
}
