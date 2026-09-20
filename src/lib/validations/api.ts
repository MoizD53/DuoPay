import { z } from "zod";
import { splitTypeEnum } from "@/db/schema";

export const CreateGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const UpdateGroupSchema = CreateGroupSchema.partial();

export const SplitInputSchema = z.object({
  userId: z.string().uuid(),
  amountMinor: z.number().int(), // Must be integer minor units
  splitType: z.enum(splitTypeEnum),
});

export const CreateExpenseSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  amountMinor: z.number().int().positive("Amount must be positive"),
  currency: z.string().length(3).default("INR"),
  paidById: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  splits: z.array(SplitInputSchema).min(1, "At least one split required"),
});

export const CreateSettlementSchema = z.object({
  groupId: z.string().uuid(),
  payerId: z.string().uuid(),
  receiverId: z.string().uuid(),
  amountMinor: z.number().int().positive("Amount must be positive"),
  currency: z.string().length(3).default("INR"),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  upiId: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Invalid UPI ID").optional().or(z.literal("")),
});
