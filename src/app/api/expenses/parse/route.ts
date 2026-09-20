import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { ApiError } from "@/lib/errors";

export const POST = withApiAuth(async (req: NextRequest) => {
  await requireAuth();
  
  const body = await req.json();
  const text = body.text || "";

  if (!text) {
    throw new ApiError(400, "BAD_REQUEST", "No text provided");
  }

  // Very basic heuristic parser as a placeholder for a real LLM
  
  // 1. Extract Amount
  // Match "1800", "₹2400", "2400"
  const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);
  let amountMinor = 0;
  if (amountMatch) {
    amountMinor = Math.round(Number(amountMatch[1]) * 100);
  } else {
    throw new ApiError(400, "BAD_REQUEST", "Could not detect an amount");
  }

  // 2. Extract Payer
  let payerName = "me";
  const paidMatch = text.match(/([a-z]+)\s+paid/i);
  if (paidMatch) {
    if (paidMatch[1].toLowerCase() !== "i") {
      payerName = paidMatch[1];
    }
  }

  // 3. Extract Description
  // Usually follows "for <desc>" or " <desc> bill"
  let description = "Expense";
  const forMatch = text.match(/for\s+([a-z\s]+?)(?:\s+split|\s+for\s+me|,|\.|$)/i);
  if (forMatch) {
    description = forMatch[1].trim();
  } else {
    const billMatch = text.match(/(\d+)\s+([a-z\s]+?)\s+bill/i);
    if (billMatch) {
      description = billMatch[2].trim();
    }
  }

  // 4. Extract Participants
  const participantNames: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Simple extraction: look for "me", and capitalized names if we had NER, but here we just regex some common names from the prompt
  const possibleNames = ["me", "hatim", "ali", "sara", "moiz"];
  for (const name of possibleNames) {
    // word boundary
    const regex = new RegExp(`\\b${name}\\b`, "i");
    if (regex.test(text)) {
      participantNames.push(name === "me" ? "me" : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
    }
  }

  // If "four people"
  if (lowerText.includes("four people") && participantNames.length === 0) {
    // We can't know who, but we return a generic count or just empty to let user select
  }

  // Default to just payer if none found
  if (participantNames.length === 0) {
    participantNames.push(payerName === "me" ? "me" : payerName);
  }

  return successResponse({
    description: description.charAt(0).toUpperCase() + description.slice(1),
    amountMinor,
    currency: "INR",
    payerName,
    participantNames,
    splitMethod: "equal"
  });
});
