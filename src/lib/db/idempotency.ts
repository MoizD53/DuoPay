import { db } from "@/db";
import { idempotencyKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function withIdempotency<T>(
  key: string,
  userId: string,
  requestPath: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if key already exists
  const existingKey = await db
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key))
    .limit(1);

  if (existingKey.length > 0) {
    if (existingKey[0].responseBody) {
      // Return previous successful response
      return JSON.parse(existingKey[0].responseBody) as T;
    }
    // Key exists but no response yet = request is currently being processed
    throw new Error("Conflict: Request is already being processed");
  }

  // Operation hasn't been done, so we perform it.
  // Note: For a strictly perfect lock, we'd insert a pending state first, 
  // but for simplicity, we execute and save.
  const result = await operation();

  // Save the result
  try {
    await db.insert(idempotencyKeys).values({
      key,
      userId,
      requestPath,
      responseBody: JSON.stringify(result),
    });
  } catch (err) {
    // If it violates unique constraint here, someone else finished it concurrently.
    if (typeof err === "object" && err !== null && "code" in err && (err as Record<string, unknown>).code === "23505") {
      throw new Error("Conflict: Request was processed concurrently");
    }
    throw err;
  }

  return result;
}
