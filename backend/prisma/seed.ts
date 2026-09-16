import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Step 1: Clearing all existing table records ---');
  const deletedSentEmails = await prisma.sentEmail.deleteMany();
  console.log(`Deleted SentEmail records: ${deletedSentEmails.count}`);

  const deletedCandidates = await prisma.candidate.deleteMany();
  console.log(`Deleted Candidate records: ${deletedCandidates.count}`);

  const deletedEmailTemplates = await prisma.emailTemplate.deleteMany();
  console.log(`Deleted EmailTemplate records: ${deletedEmailTemplates.count}`);

  const deletedGmailConnections = await prisma.gmailConnection.deleteMany();
  console.log(`Deleted GmailConnection records: ${deletedGmailConnections.count}`);

  console.log('\n--- Step 2: Seeding 3 Candidates ---');
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
  console.log(`Created Candidates: ${candidatesData.length}`);

  console.log('\n--- Step 3: Seeding 3 EmailTemplates ---');
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
  console.log(`Created EmailTemplates: ${templatesData.length}`);

  console.log('\n--- Database Reset & Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during database reset/seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
