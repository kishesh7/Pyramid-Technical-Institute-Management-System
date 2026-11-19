import type { Prisma } from "../src/generated/prisma/client";
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const name = (await rl.question("Admin name: ")).trim();
    const email = (await rl.question("Admin email: "))
      .trim()
      .toLowerCase();

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid name and email address.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("This email already exists. No user was created.");
    }

    // Generate a strong, random initial password.
    const temporaryPassword = randomBytes(24).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const adminRole = await prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: {
        name: "ADMIN",
        description: "Full administrator access",
      },
    });

 const user = await prisma.$transaction(
  async (tx: Prisma.TransactionClient) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        status: "ACTIVE",
      },
    });

    await tx.userRole.create({
      data: {
        userId: newUser.id,
        roleId: adminRole.id,
      },
    });

    return newUser;
  }
);
    console.log("\nAdmin account created successfully!");
    console.log("Email:", user.email);
    console.log("Temporary password:", temporaryPassword);
    console.log("\nSave this password securely. It will not be shown again.");
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error("Admin creation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
