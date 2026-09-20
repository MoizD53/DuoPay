import { db } from "@/db";
import { settlements, ledgerEntries } from "@/db/schema";
import { withIdempotency } from "@/lib/db/idempotency";
import { v4 as uuidv4 } from "uuid";

export type CreateSettlementInput = {
  idempotencyKey: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amountMinor: number;
  currency?: string;
};

export async function createSettlement(input: CreateSettlementInput) {
  return withIdempotency(input.idempotencyKey, input.payerId, `/api/groups/${input.groupId}/settlements`, async () => {
    
    if (input.amountMinor <= 0) {
      throw new Error("Settlement amount must be positive");
    }
    
    const currency = input.currency || "INR";

    const result = await db.transaction(async (tx) => {
      // 1. Create Settlement record
      const [settlement] = await tx.insert(settlements).values({
        groupId: input.groupId,
        payerId: input.payerId,
        receiverId: input.receiverId,
        amountMinor: input.amountMinor,
        currency,
        status: "CONFIRMED", // For simplicity, we directly confirm if the user clicks "Settle"
      }).returning();

      // 2. Ledger Entries
      const timestamp = new Date();
      
      // Payer (debtor) reduces their debt, so their balance increases (credit)
      await tx.insert(ledgerEntries).values({
        userId: input.payerId,
        groupId: input.groupId,
        amountMinor: input.amountMinor,
        currency,
        eventType: "SETTLEMENT_CONFIRMED",
        referenceId: settlement.id,
        createdAt: timestamp,
      });

      // Receiver (creditor) gets paid, so their balance decreases (debit)
      await tx.insert(ledgerEntries).values({
        userId: input.receiverId,
        groupId: input.groupId,
        amountMinor: -input.amountMinor,
        currency,
        eventType: "SETTLEMENT_CONFIRMED",
        referenceId: settlement.id,
        createdAt: timestamp,
      });

      return settlement;
    });

    return result;
  });
}
