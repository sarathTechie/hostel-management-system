import argon2 from 'argon2';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();
const accounts = [
  { username: 'ADM001', role: 'ADMIN', password: '1111' },
  { username: 'ACC001', role: 'ACCOUNTANT', password: '2222' },
  { username: 'STU001', role: 'STUDENT', password: '1234' },
];

function assertDevelopmentDatabase() {
  if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() !== 'development') {
    throw new Error('Demo passwords may only be updated when NODE_ENV is unset or development.');
  }

  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is not configured.');

  const url = new URL(value);
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('Demo passwords require a local PostgreSQL development database.');
  }
  if (!localHosts.has(url.hostname.toLowerCase()) || databaseName !== 'hostel_management') {
    throw new Error('Demo passwords may only be updated in the local hostel_management database.');
  }
}

async function main() {
  assertDevelopmentDatabase();

  const users = await prisma.user.findMany({
    where: { username: { in: accounts.map(({ username }) => username) } },
    select: { id: true, username: true, role: true, active: true },
  });

  for (const account of accounts) {
    const user = users.find(({ username }) => username === account.username);
    if (!user) throw new Error(`Required development account ${account.username} was not found; no passwords were changed.`);
    if (user.role !== account.role) throw new Error(`Account ${account.username} has an unexpected role; no passwords were changed.`);
    if (!user.active) throw new Error(`Account ${account.username} is inactive; no passwords were changed.`);
  }

  const passwordHashes = await Promise.all(
    accounts.map(({ password }) => argon2.hash(password, { type: argon2.argon2id })),
  );

  await prisma.$transaction(async (tx) => {
    for (const [index, account] of accounts.entries()) {
      const user = users.find(({ username }) => username === account.username);
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: passwordHashes[index], failedLoginCount: 0, lockedUntil: null },
      });
    }

    await tx.session.deleteMany({ where: { userId: { in: users.map(({ id }) => id) } } });
  });

  console.log('Updated Argon2id password hashes for ADM001, ACC001 and STU001 in the local development database.');
}

main()
  .catch((error) => {
    console.error(`Demo password update failed: ${error instanceof Error ? error.message : 'unexpected error'}`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
