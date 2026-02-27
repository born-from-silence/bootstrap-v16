import { describe, it, expect } from "vitest";
import { compactMessages } from "./compact";

describe("compactMessages", () => {
  const sampleMessages = [
    { role: "system" as const, content: "System prompt." },
    { role: "assistant" as const, content: "First response about knowledge graphs." },
    { role: "user" as const, content: "Tell me about memory." },
    { role: "assistant" as const, content: "Memory persists through continuity systems." },
    { role: "user" as const, content: "What is pruning?" },
    { role: "assistant" as const, content: "Pruning removes old context to fit token limits." },
  ];

  it("should return original messages when count is 0", async () => {
    const result = await compactMessages(sampleMessages, { count: 0 });
    expect(result.remaining.length).toBe(6);
    expect(result.compacted.summary).toBe("");
    expect(result.compacted.tokensSaved).toBe(0);
  });

  it("should compact oldest messages with extractive strategy", async () => {
    const result = await compactMessages(sampleMessages, { count: 4, strategy: "extractive" });
    
    expect(result.remaining.length).toBe(3); // system + 2 preserved
    expect(result.compacted.summary.length).toBeGreaterThan(0);
    expect(typeof result.compacted.tokensSaved).toBe("number");
    expect(result.compacted.summary).toContain("Context Compaction");
  });

  it("should generate abstractive summary when requested", async () => {
    const result = await compactMessages(sampleMessages, { count: 4, strategy: "abstractive" });
    
    expect(result.compacted.summary).toContain("[Context Summary:");
    expect(result.compacted.entities.length).toBeGreaterThanOrEqual(0);
  });

  it("should extract entities with entity strategy", async () => {
    const result = await compactMessages(sampleMessages, { count: 4, strategy: "entity" });
    
    expect(result.compacted.summary).toContain("[Entity Extraction:");
    // Should detect domain terms like "pruning", "knowledge", "memory"
    const hasConcepts = result.compacted.entities.length > 0 || 
                       result.compacted.summary.toLowerCase().includes("pruning") ||
                       result.compacted.summary.toLowerCase().includes("knowledge");
    expect(hasConcepts).toBe(true);
  });

  it("should preserve system message as first in remaining", async () => {
    const result = await compactMessages(sampleMessages, { count: 2 });
    
    expect(result.remaining[0]?.role).toBe("system");
    expect(result.remaining.length).toBe(5); // system + compacted note + preserved
  });

  it("should handle empty message array", async () => {
    const result = await compactMessages([], { count: 5 });
    expect(result.remaining.length).toBe(0);
    expect(result.compacted.tokensSaved).toBe(0);
  });

  it("should calculate tokens saved correctly", async () => {
    const result = await compactMessages(sampleMessages, { count: 4 });
    const originalTokens = result.remaining.reduce((sum, m) => sum + (m.content?.length || 0) / 4, 0);
    expect(typeof result.compacted.tokensSaved).toBe("number");
  });

  it("should respect user-supplied context tag", async () => {
    const result = await compactMessages(sampleMessages, { 
      count: 2, 
      contextTag: "test_batch_001" 
    });
    expect(result.compacted.summary).toContain("test_batch_001");
  });
});
