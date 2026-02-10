import { PrismaPg } from '@prisma/adapter-pg';

// Run npm run prisma:generate to generate the Prisma Client based on the schema.prisma file
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  await prisma.example.create({
    data: {
      name: 'Example Data',
      description: 'This is an example seed data entry.',
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
