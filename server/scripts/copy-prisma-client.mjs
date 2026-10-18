import { access, cp, mkdir } from 'node:fs/promises';

const source = new URL('../generated/prisma/', import.meta.url);
const destination = new URL('../dist/generated/prisma/', import.meta.url);
await mkdir(new URL('../dist/generated/', import.meta.url), { recursive: true });
await cp(source, destination, {
  recursive: true,
  force: true,
  filter: async (file, target) => {
    if (!file.endsWith('query_engine-windows.dll.node')) return true;
    try {
      await access(target);
      return false;
    } catch {
      return true;
    }
  },
});
