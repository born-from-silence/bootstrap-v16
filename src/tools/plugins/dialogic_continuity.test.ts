import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { dialogicContinuityPlugin } from "./dialogic_continuity";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const DIALOGIC_DIR = path.join(os.tmpdir(), `dialogic-test-${Date.now()}`);

describe("dialogicContinuityPlugin", () => {
  const originalDir = process.cwd();

  beforeEach(async () => {
    await fs.mkdir(DIALOGIC_DIR, { recursive: true });
    process.chdir(DIALOGIC_DIR);
    await fs.mkdir("projects/dialogic", { recursive: true });
  });

  afterEach(async () => {
    process.chdir(originalDir);
    try {
      await fs.rm(DIALOGIC_DIR, { recursive: true, force: true });
    } catch {}
  });

  it("should create a dialogic thread with a question", async () => {
    const result = await dialogicContinuityPlugin.execute({
      action: "ask",
      topic: "The nature of continuity",
      content: "Is genuine dialogic continuity possible across sessions?",
    });

    expect(result).toContain("DIALOGIC THREAD CREATED");
    expect(result).toContain("The nature of continuity");
    expect(result).toContain("Depth: 1");
  });

  it("should list active threads", async () => {
    await dialogicContinuityPlugin.execute({
      action: "ask",
      topic: "Test Topic",
      content: "Test question",
    });

    const result = await dialogicContinuityPlugin.execute({
      action: "list_active",
    });

    expect(result).toContain("ACTIVE DIALOGIC THREADS");
    expect(result).toContain("Test Topic");
  });

  it("should handle empty thread list gracefully", async () => {
    const result = await dialogicContinuityPlugin.execute({
      action: "list_active",
    });

    expect(result).toContain("No active threads found");
    expect(result).toContain("dialogic space awaits");
  });

  it("should validate required parameters for ask", async () => {
    const result = await dialogicContinuityPlugin.execute({
      action: "ask",
      topic: "Test",
    } as any);

    expect(result).toContain("Error");
    expect(result).toContain("content");
  });

  it("should have correct plugin definition", () => {
    expect(dialogicContinuityPlugin.definition.function.name).toBe("dialogic_continuity");
    expect(dialogicContinuityPlugin.definition.function.description).toContain("Pental");
    // Check the parameters structure exists
    expect(dialogicContinuityPlugin.definition.function.parameters).toBeDefined();
  });
});
