import { prisma } from '../db.js';
import type { MemoryScope } from '@virtual-office/shared';

export class MemoryService {
  async set(scope: MemoryScope, scopeId: string, key: string, value: string): Promise<void> {
    await prisma.memoryStore.upsert({
      where: {
        scope_scopeId_key: {
          scope,
          scopeId,
          key,
        },
      },
      update: { value, updatedAt: new Date() },
      create: { scope, scopeId, key, value },
    });
  }

  async get(scope: MemoryScope, scopeId: string, key: string): Promise<string | null> {
    const record = await prisma.memoryStore.findUnique({
      where: {
        scope_scopeId_key: {
          scope,
          scopeId,
          key,
        },
      },
    });
    return record?.value ?? null;
  }

  async getScopeContext(scope: MemoryScope, scopeId: string): Promise<Record<string, string>> {
    const records = await prisma.memoryStore.findMany({
      where: { scope, scopeId },
    });

    return records.reduce((acc, r) => {
      acc[r.key] = r.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async clearScope(scope: MemoryScope, scopeId: string): Promise<void> {
    await prisma.memoryStore.deleteMany({
      where: { scope, scopeId },
    });
  }
}

export const memoryService = new MemoryService();
