import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mockCandidates = [
    {
      firstName: 'Robert',
      lastName: 'Khachaturov',
      fullName: 'Robert Khachaturov',
      email: 'Khachaturovir@gmail.com',
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
      name: 'Предложение о работе',
      subject: 'Вакансия Frontend Developer — {{projectTitle}}',
      body: `Здравствуйте, {{firstName}}!

Я ознакомился с вашим профилем и хотел бы связаться с вами по поводу позиции {{projectTitle}}.

Буду рад рассказать подробнее о вакансии и обсудить возможные детали сотрудничества.

С уважением,
Robert`,
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
