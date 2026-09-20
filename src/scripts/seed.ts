import { db } from "../db";
import { users, groups, groupMembers, expenses, expenseSplits, ledgerEntries } from "../db/schema";
import { v4 as uuidv4 } from "uuid";

async function main() {
  console.log("🌱 SEEDING DATABASE (DEVELOPMENT ONLY) 🌱");

  // Create users
  const moizId = uuidv4();
  const hatimId = uuidv4();
  const aliId = uuidv4();
  
  await db.insert(users).values([
    { id: moizId, email: "moiz@example.com", name: "Moiz" },
    { id: hatimId, email: "hatim@example.com", name: "Hatim" },
    { id: aliId, email: "ali@example.com", name: "Ali" },
  ]).onConflictDoNothing();

  // Create group
  const groupId = uuidv4();
  await db.insert(groups).values({
    id: groupId,
    name: "Goa Trip",
    createdBy: moizId,
  }).onConflictDoNothing();

  // Add members
  await db.insert(groupMembers).values([
    { groupId, userId: moizId, role: "ADMIN" },
    { groupId, userId: hatimId, role: "MEMBER" },
    { groupId, userId: aliId, role: "MEMBER" },
  ]).onConflictDoNothing();

  console.log("✅ Seed complete");
  console.log(`Moiz ID: ${moizId}`);
  console.log(`Hatim ID: ${hatimId}`);
  console.log(`Ali ID: ${aliId}`);
  console.log(`Group ID: ${groupId}`);
  process.exit(0);
}

main().catch(e => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
