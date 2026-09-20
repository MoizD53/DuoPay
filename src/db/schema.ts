import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Enums (String constants in SQLite)
export const splitTypeEnum = ["EQUAL", "EXACT", "PERCENTAGE", "SHARES"] as const;
export const settlementStatusEnum = ["INITIATED", "CONFIRMED", "REVERSED"] as const;
export const ledgerEventTypeEnum = [
  "EXPENSE_CREATED",
  "EXPENSE_UPDATED",
  "EXPENSE_DELETED",
  "SETTLEMENT_INITIATED",
  "SETTLEMENT_CONFIRMED",
  "SETTLEMENT_REVERSED",
] as const;

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  upiId: text("upi_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    providerProviderAccountIdIdx: uniqueIndex("accounts_provider_providerAccountId_idx").on(account.provider, account.providerAccountId),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const friendships = sqliteTable("friendships", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  userId: text("user_id").references(() => users.id).notNull(),
  friendId: text("friend_id").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, (t) => ({
  friendshipsUserFriendIdx: uniqueIndex("friendships_user_friend_idx").on(t.userId, t.friendId)
}));

export const friendRequests = sqliteTable("friend_requests", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  senderId: text("sender_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING, ACCEPTED, REJECTED
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, (t) => ({
  friendRequestsSenderReceiverIdx: uniqueIndex("friend_requests_sender_receiver_idx").on(t.senderId, t.receiverId)
}));

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const groupMembers = sqliteTable("group_members", {
  userId: text("user_id").references(() => users.id).notNull(),
  groupId: text("group_id").references(() => groups.id).notNull(),
  role: text("role").default("MEMBER").notNull(), // e.g. ADMIN, MEMBER
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, (t) => ({
  groupMembersUserGroupIdx: uniqueIndex("group_members_user_group_idx").on(t.userId, t.groupId)
}));

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  groupId: text("group_id").references(() => groups.id).notNull(),
  title: text("title").notNull(),
  amountMinor: integer("amount_minor", { mode: "number" }).notNull(), // minor units (e.g. paise)
  currency: text("currency").default("INR").notNull(),
  paidBy: text("paid_by").references(() => users.id).notNull(),
  createdBy: text("created_by").references(() => users.id).notNull(),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, DELETED
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const expenseSplits = sqliteTable("expense_splits", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  expenseId: text("expense_id").references(() => expenses.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  amountMinor: integer("amount_minor", { mode: "number" }).notNull(),
  splitType: text("split_type").notNull(), // EQUAL, EXACT, PERCENTAGE, SHARES
});

export const settlements = sqliteTable("settlements", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  groupId: text("group_id").references(() => groups.id).notNull(),
  payerId: text("payer_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  amountMinor: integer("amount_minor", { mode: "number" }).notNull(),
  currency: text("currency").default("INR").notNull(),
  status: text("status").notNull(), // INITIATED, CONFIRMED, REVERSED
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  userId: text("user_id").references(() => users.id).notNull(),
  groupId: text("group_id").references(() => groups.id).notNull(),
  amountMinor: integer("amount_minor", { mode: "number" }).notNull(), // Positive = Credit (Owed), Negative = Debit (Owes)
  currency: text("currency").default("INR").notNull(),
  eventType: text("event_type").notNull(),
  referenceId: text("reference_id").notNull(), // ID of Expense or Settlement
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const idempotencyKeys = sqliteTable("idempotency_keys", {
  key: text("key").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  requestPath: text("request_path").notNull(),
  responseBody: text("response_body"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const circles = sqliteTable("circles", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const circleMembers = sqliteTable("circle_members", {
  circleId: text("circle_id").references(() => circles.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, (t) => ({
  circleMembersCircleUserIdx: uniqueIndex("circle_members_circle_user_idx").on(t.circleId, t.userId)
}));

// Relations for easier querying
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(groupMembers),
  circleMemberships: many(circleMembers),
  expensesPaid: many(expenses, { relationName: "PaidBy" }),
  expensesCreated: many(expenses, { relationName: "CreatedBy" }),
  splits: many(expenseSplits),
  settlementsPaid: many(settlements, { relationName: "Payer" }),
  settlementsReceived: many(settlements, { relationName: "Receiver" }),
  ledgerEntries: many(ledgerEntries),
  friendships: many(friendships, { relationName: "UserFriendships" }),
  friendsOf: many(friendships, { relationName: "FriendUsers" }),
  sentRequests: many(friendRequests, { relationName: "SentRequests" }),
  receivedRequests: many(friendRequests, { relationName: "ReceivedRequests" }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "UserFriendships",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "FriendUsers",
  }),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  sender: one(users, {
    fields: [friendRequests.senderId],
    references: [users.id],
    relationName: "SentRequests",
  }),
  receiver: one(users, {
    fields: [friendRequests.receiverId],
    references: [users.id],
    relationName: "ReceivedRequests",
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
  ledgerEntries: many(ledgerEntries),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const circlesRelations = relations(circles, ({ one, many }) => ({
  creator: one(users, {
    fields: [circles.createdBy],
    references: [users.id],
  }),
  members: many(circleMembers),
}));
