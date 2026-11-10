
import { PrismaClient } from '../generated/prisma/index.js';
import argon2 from 'argon2';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const prisma = new PrismaClient();
const rl = readline.createInterface({ input, output });

try {
  const username = (await rl.question('New admin username: ')).trim();

  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
    throw new Error('Use 3–40 letters, numbers, dots, underscores, or hyphens.');
  }

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    throw new Error('That username already exists. No changes made.');
  }

  const password = await rl.question('New admin password (input may be visible): ');

  if (password.length < 12) {
    throw new Error('Use a password of at least 12 characters.');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      name: 'Hostel Administrator',
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('Admin account created successfully.');
} finally {
  rl.close();
  await prisma.$disconnect();
}
