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

  const mockTemplates = [
    {
      name: 'Job Opportunity',
      subject: 'Opportunity for {{firstName}} - {{projectTitle}}',
      body: 'Hi {{firstName}},\n\nWe were impressed by your background and would love to discuss the {{projectTitle}} role with you.\n\nBest regards,\nRecruiting Team',
    },
    {
      name: 'Interview Invitation',
      subject: 'Interview Invitation for {{firstName}}',
      body: 'Dear {{firstName}},\n\nWe would like to invite you to an interview for the {{projectTitle}} position.\n\nBest regards,\nRecruiting Team',
    },
  ];

  console.log('Seeding mock email templates...');
  for (const template of mockTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {
        subject: template.subject,
        body: template.body,
      },
      create: template,
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
