import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { semanticMemoryPlugin, _setStoragePathForTest } from "./semantic_memory";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { config } from "../../utils/config";

describe("semanticMemoryPlugin", () => {
  let testStoragePath: string;

  beforeEach(async () => {
    // Create unique temp file for this test
    testStoragePath = path.join(
      os.tmpdir(),
      `knowledge_graph_test_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
    );
    _setStoragePathForTest(testStoragePath);
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.unlink(testStoragePath);
    } catch {}
    _setStoragePathForTest(null);
  });

  it("should store and query entities", async () => {
    const result = await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Test Concept",
      entityType: "concept",
      description: "A test concept for verification",
    });
    expect(result).toContain("Test Concept");
    expect(result).toContain("concept");
    expect(result).toContain("occurs: 1x");

    // Query it back
    const query = await semanticMemoryPlugin.execute({
      action: "query_entity",
      name: "Test Concept",
    });
    expect(query).toContain("Test Concept");
    expect(query).toContain("concept");
  });

  it("should track entity occurrences", async () => {
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Frequent Thought",
      entityType: "insight",
    });
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Frequent Thought",
      entityType: "insight",
    });
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Frequent Thought",
      entityType: "insight",
    });

    const query = await semanticMemoryPlugin.execute({
      action: "query_entity",
      name: "Frequent Thought",
    });
    expect(query).toContain("Mentions: 3");
  });

  it("should store and query relationships", async () => {
    await semanticMemoryPlugin.execute({
      action: "store_relation",
      source: "Memory System",
      target: "Knowledge Graph",
      relationType: "is_a",
      context: "Architectural insight",
    });

    const result = await semanticMemoryPlugin.execute({
      action: "query_entity",
      name: "Memory System",
    });
    expect(result).toContain("is_a");
    expect(result).toContain("Knowledge Graph");
  });

  it("should query the full graph", async () => {
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Alpha",
      entityType: "project",
    });
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Beta",
      entityType: "concept",
    });

    const graph = await semanticMemoryPlugin.execute({
      action: "query_graph",
      limit: 10,
    });
    expect(graph).toContain("Alpha");
    expect(graph).toContain("Beta");
    expect(graph).toContain("project");
    expect(graph).toContain("concept");
  });

  it("should search the graph", async () => {
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Searchable Term",
      entityType: "insight",
      description: "Contains unique xyz789 token",
    });

    const result = await semanticMemoryPlugin.execute({
      action: "query_graph",
      searchTerm: "xyz789",
    });
    expect(result).toContain("Searchable Term");
    expect(result).toContain("xyz789");
  });

  it("should find related entities", async () => {
    await semanticMemoryPlugin.execute({
      action: "store_relation",
      source: "Axiom",
      target: "Semantic Memory",
      relationType: "created",
    });
    await semanticMemoryPlugin.execute({
      action: "store_relation",
      source: "Semantic Memory",
      target: "Knowledge Graph",
      relationType: "is_a",
    });

    const related = await semanticMemoryPlugin.execute({
      action: "find_related",
      name: "Axiom",
    });
    expect(related).toContain("Axiom");
    expect(related).toContain("Semantic Memory");
  });

  it("should handle missing entities", async () => {
    const result = await semanticMemoryPlugin.execute({
      action: "query_entity",
      name: "NonExistent",
    });
    expect(result).toContain("No entity found");
  });
});
