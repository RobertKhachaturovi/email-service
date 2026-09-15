import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mockCandidates = [
    {
      firstName: 'Alice',
      lastName: 'Smith',
      fullName: 'Alice Smith',
      email: 'alice.smith@example.com',
      projectTitle: 'Senior Frontend Engineer',
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      fullName: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      projectTitle: 'Backend Node.js Developer',
    },
    {
      firstName: 'Carol',
      lastName: 'Williams',
      fullName: 'Carol Williams',
      email: 'carol.williams@example.com',
      projectTitle: 'Full Stack Engineer',
    },
  ];

  console.log('Seeding mock candidates...');
  for (const candidate of mockCandidates) {
    await prisma.candidate.upsert({
      where: { email: candidate.email },
      update: {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        fullName: candidate.fullName,
        projectTitle: candidate.projectTitle,
      },
      create: candidate,
    });
  }
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
