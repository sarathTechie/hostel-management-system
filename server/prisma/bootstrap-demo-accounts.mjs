import argon2 from 'argon2';
import { Prisma, PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();
const accounts = [
  {
    username: 'ADM001',
    role: 'ADMIN',
    name: 'Hostel Administrator',
    passwordVariable: 'HMS_BOOTSTRAP_ADMIN_PASSWORD',
  },
  {
    username: 'STU001',
    role: 'STUDENT',
    name: 'HMS Student',
    passwordVariable: 'HMS_BOOTSTRAP_STUDENT_PASSWORD',
  },
  {
    username: 'ACC001',
    role: 'ACCOUNTANT',
    name: 'HMS Accountant',
    passwordVariable: 'HMS_BOOTSTRAP_ACCOUNTANT_PASSWORD',
  },
];

function getBootstrapPasswords() {
  return accounts.map((account) => {
    const password = process.env[account.passwordVariable];
    if (!password || password.length < 8) {
      throw new Error(`${account.passwordVariable} must be set to a password of at least 8 characters.`);
    }

    return { ...account, password };
  });
}

function assertNeonDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set in the temporary bootstrap environment file.');
  }

  let databaseUrl;
  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)
    || !databaseUrl.hostname.toLowerCase().endsWith('.neon.tech')
    || !['require', 'verify-ca', 'verify-full'].includes(databaseUrl.searchParams.get('sslmode'))) {
    throw new Error('Refusing to run: DATABASE_URL must target a Neon PostgreSQL host and require TLS.');
  }
}

async function main() {
  assertNeonDatabase();
  const accountsWithPasswords = getBootstrapPasswords();
  const preparedAccounts = await Promise.all(accountsWithPasswords.map(async (account) => ({
    ...account,
    passwordHash: await argon2.hash(account.password, { type: argon2.argon2id }),
  })));

  await prisma.$transaction(async (transaction) => {
    const existingUsers = await transaction.user.findMany({
      where: { username: { in: accounts.map(({ username }) => username) } },
      select: { username: true, role: true },
    });

    const roleConflicts = existingUsers.filter((user) => (
      user.role !== accounts.find((account) => account.username === user.username).role
    ));
    if (roleConflicts.length > 0) {
      throw new Error(`Refusing to change account roles; unexpected existing role for: ${roleConflicts.map(({ username }) => username).join(', ')}.`);
    }

    for (const account of preparedAccounts) {
      await transaction.user.upsert({
        where: { username: account.username },
        create: {
          username: account.username,
          name: account.name,
          role: account.role,
          passwordHash: account.passwordHash,
          active: true,
          failedLoginCount: 0,
          lockedUntil: null,
        },
        update: {
          role: account.role,
          passwordHash: account.passwordHash,
          active: true,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  console.log('Bootstrapped the three requested HMS user accounts.');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error && error.message.startsWith('DATABASE_URL')
    ? error.message
    : error instanceof Error && error.message.startsWith('Refusing to')
      ? error.message
      : error instanceof Error && error.message.startsWith('HMS_BOOTSTRAP_')
        ? error.message
        : 'Account bootstrap failed. Check database connectivity and local logs without sharing credentials.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
