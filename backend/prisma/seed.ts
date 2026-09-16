import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.sentEmail.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.gmailConnection.deleteMany();

  console.log('Seeding candidates...');
  const candidatesData = [
    {
      firstName: 'Robert',
      lastName: 'Khachaturovi',
      fullName: 'Robert Khachaturovi',
      email: 'Khachaturovir@gmail.com',
      projectTitle: 'Email Service',
    },
    {
      firstName: 'Anna',
      lastName: 'Ivanova',
      fullName: 'Anna Ivanova',
      email: 'anna.ivanova@example.com',
      projectTitle: 'Frontend Developer',
    },
    {
      firstName: 'David',
      lastName: 'Smith',
      fullName: 'David Smith',
      email: 'david.smith@example.com',
      projectTitle: 'Software Engineer',
    },
  ];

  for (const candidate of candidatesData) {
    await prisma.candidate.create({
      data: candidate,
    });
  }

  console.log('Seeding email templates...');
  const templatesData = [
    {
      name: 'Interview Invitation',
      subject: 'Interview Invitation for {{firstName}}',
      body: `Dear {{firstName}},

You are invited to an interview for the position of {{projectTitle}}.

Best regards,
Recruiting Team`,
    },
    {
      name: 'Project Update',
      subject: 'Update Regarding {{projectTitle}}',
      body: `Hello {{firstName}},

We have an update regarding your application for the {{projectTitle}} position.

Best regards,
Recruiting Team`,
    },
    {
      name: 'Welcome Email',
      subject: 'Welcome to the {{projectTitle}} Team',
      body: `Welcome {{firstName}}!

We are excited to welcome you to the {{projectTitle}} team.

Best regards,
Recruiting Team`,
    },
  ];

  for (const template of templatesData) {
    await prisma.emailTemplate.create({
      data: template,
    });
  }

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
