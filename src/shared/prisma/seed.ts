import { PrismaPg } from '@prisma/adapter-pg';

// Run npm run prisma:generate to generate the Prisma Client based on the schema.prisma file
import { PrismaClient } from '../../../generated/prisma/client';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: DATABASE_URL,
  }),
});

async function main() {
  console.log('Seeding database...');

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
    },
  });

  // Create posts
  await prisma.post.create({
    data: {
      title: 'First Post',
      content: 'This is the content of the first post.',
      published: true,
      authorId: user1.id,
    },
  });

  await prisma.post.create({
    data: {
      title: 'Second Post',
      content: 'This is the content of the second post.',
      published: false,
      authorId: user1.id,
    },
  });

  await prisma.post.create({
    data: {
      title: 'Jane\'s Post',
      content: 'This is a post by Jane.',
      published: true,
      authorId: user2.id,
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

