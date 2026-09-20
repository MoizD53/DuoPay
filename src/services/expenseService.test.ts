import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExpense } from './expenseService';
import { db } from '@/db';
import { validateSplitsExact } from '@/lib/finance/engine';
import { IdempotencyConflictError } from '@/lib/errors';

// Mock the DB and transaction
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    transaction: vi.fn(async (cb) => {
      return cb({
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'exp-123' }])
          })
        })
      });
    }),
  }
}));

describe('Expense Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an expense when inputs are valid', async () => {
    const input = {
      idempotencyKey: 'key-1',
      groupId: 'grp-1',
      title: 'Dinner',
      amountMinor: 1000,
      paidById: 'user-1',
      createdById: 'user-1',
      splits: [
        { userId: 'user-1', amountMinor: 500, splitType: 'EQUAL' as const },
        { userId: 'user-2', amountMinor: 500, splitType: 'EQUAL' as const }
      ]
    };

    const result = await createExpense(input);
    expect(result).toBeDefined();
    expect(db.transaction).toHaveBeenCalled();
  });

  it('should fail if splits do not match total amount', async () => {
    const input = {
      idempotencyKey: 'key-2',
      groupId: 'grp-1',
      title: 'Dinner',
      amountMinor: 1000,
      paidById: 'user-1',
      createdById: 'user-1',
      splits: [
        { userId: 'user-1', amountMinor: 500, splitType: 'EQUAL' as const },
        { userId: 'user-2', amountMinor: 400, splitType: 'EQUAL' as const } // Total is 900
      ]
    };

    await expect(createExpense(input)).rejects.toThrow(/Split validation failed/);
  });
});
