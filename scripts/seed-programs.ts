
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing.");
}

const databaseName = decodeURIComponent(
  new URL(databaseUrl).pathname.replace(/^\//, "")
);

if (databaseName !== "pyramid_ngo") {
  throw new Error(
    `Safety check failed: expected pyramid_ngo, found ${databaseName}.`
  );
}

const trainingPrograms = [
  {
    name: "Computer Hardware & Networking (CHN)",
    description: "Training in computer hardware, maintenance and networking.",
  },
  {
    name: "Community Health Worker (CHW)",
    description: "Training in community health awareness and basic healthcare.",
  },
  {
    name: "Tailoring & Dress Making",
    description: "Practical training in tailoring, stitching and dress making.",
  },
  {
    name: "Digital Literacy & E-Commerce",
    description: "Training in digital skills and basic e-commerce.",
  },
  {
    name: "Plumbing & Sanitation Technology",
    description: "Practical training in plumbing and sanitation technology.",
  },
  {
    name: "Mobile Phone Repair & Maintenance",
    description: "Training in mobile phone troubleshooting and repair.",
  },
];

async function main() {
  console.log("Connected database:", databaseName);

  // Find the project or create it if it does not exist.
  let project = await prisma.project.findUnique({
    where: {
      code: "TRAINING-SKILLS",
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Training & Skills Development",
        code: "TRAINING-SKILLS",
        description: "Training and skills development programs.",
        status: "PLANNING",
      },
    });

    console.log("Created project:", project.name);
  } else {
    console.log("Using existing project:", project.name);
  }

  // Add programs without creating duplicates.
  for (const program of trainingPrograms) {
    const existingProgram = await prisma.program.findFirst({
      where: {
        projectId: project.id,
        name: program.name,
      },
    });

    if (existingProgram) {
      console.log("Already exists:", program.name);
      continue;
    }

    await prisma.program.create({
      data: {
        ...program,
        projectId: project.id,
        status: "ACTIVE",
      },
    });

    console.log("Created:", program.name);
  }

  console.log("Training program seeding completed.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
