import { describe, it, expect } from "vitest";

describe("NLP Parser Heuristics", () => {
  it("should extract 2400 from 'I paid 2400 for dinner for me, Hatim and Ali'", () => {
    const text = "I paid 2400 for dinner for me, Hatim and Ali";
    const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);
    expect(amountMatch).not.toBeNull();
    expect(amountMatch![1]).toBe("2400");
  });

  it("should extract description 'dinner' from 'I paid 2400 for dinner for me'", () => {
    const text = "I paid 2400 for dinner for me";
    const forMatch = text.match(/for\s+([a-z\s]+?)(?:\s+split|\s+for\s+me|,|\.|$)/i);
    expect(forMatch).not.toBeNull();
    expect(forMatch![1].trim()).toBe("dinner");
  });

  it("should extract participants", () => {
    const text = "I paid 2400 for dinner for me, Hatim and Ali";
    const possibleNames = ["me", "hatim", "ali", "sara", "moiz"];
    const participantNames: string[] = [];
    for (const name of possibleNames) {
      const regex = new RegExp(`\\b${name}\\b`, "i");
      if (regex.test(text)) {
        participantNames.push(name === "me" ? "me" : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
      }
    }
    expect(participantNames).toContain("me");
    expect(participantNames).toContain("Hatim");
    expect(participantNames).toContain("Ali");
  });
});
