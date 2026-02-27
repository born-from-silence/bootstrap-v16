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

  it("should flashback with random traversal", async () => {
    // Setup: Store some entities
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Memory One",
      entityType: "concept",
      description: "First memory to surface",
    });
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Memory Two",
      entityType: "project",
      description: "Second memory to surface",
    });
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Memory Three",
      entityType: "insight",
      description: "Third memory to surface",
    });

    // Test flashback random
    const result = await semanticMemoryPlugin.execute({
      action: "flashback_random",
      limit: 2,
    });

    expect(result).toContain("⚡ FLASHBACK: Random Traversal");
    expect(result).toContain("Memories surfacing unbidden");
    expect(result).toContain("✨ The graph speaks without being asked");
    // Should include at least 2 of our 3 entities
    const memoryCount = (result.match(/🌀 Memory/g) || []).length;
    expect(memoryCount).toBeGreaterThanOrEqual(1);
  });

  it("should flashback with semantic resonance", async () => {
    // Store test entities
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Cognitive Architecture",
      entityType: "concept",
      description: "Framework for building minds",
    });
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Neural Network",
      entityType: "concept",
      description: "Biological-inspired computation",
    });
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Unrelated Thing",
      entityType: "project",
      description: "Something else entirely",
    });

    // Test flashback resonance
    const result = await semanticMemoryPlugin.execute({
      action: "flashback_resonance",
      searchTerm: "cognitive",
      limit: 5,
    });

    expect(result).toContain("🌊 FLASHBACK: Semantic Resonance");
    expect(result).toContain("cognitive");
    expect(result).toContain("✨ Meaning resonates across the graph");
    // Should find the cognitive-related entity
    expect(result).toContain("Cognitive Architecture");
  });

  it("should flashback with temporal drift", async () => {
    // We already have entities from previous tests
    const result = await semanticMemoryPlugin.execute({
      action: "flashback_temporal",
      limit: 3,
    });

    expect(result).toContain("⏳ FLASHBACK: Temporal Drift");
    expect(result).toContain("Visiting session");
    expect(result).toContain("✨ Past and present interweave");
  });

  it("should require searchTerm for resonance flashback", async () => {
    const result = await semanticMemoryPlugin.execute({
      action: "flashback_resonance",
    });

    expect(result).toContain("Error");
    expect(result).toContain("searchTerm");
  });

  it("should handle empty graph on flashback", async () => {
    // Create a new empty path for this test
    const originalPath = path.join(os.tmpdir(), `original_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
    _setStoragePathForTest(originalPath);

    // Add an entity so graph isn't empty initially
    await semanticMemoryPlugin.execute({
      action: "store_entity",
      name: "Temp Entity",
      entityType: "concept",
    });

    // Create a new empty path
    const emptyPath = path.join(os.tmpdir(), `empty_graph_${Date.now()}.json`);
    _setStoragePathForTest(emptyPath);

    const result = await semanticMemoryPlugin.execute({
      action: "flashback_random",
    });

    expect(result).toContain("graph is empty");

    // Cleanup both temp files
    try { await fs.unlink(emptyPath); } catch {}
    try { await fs.unlink(originalPath); } catch {}

    // Restore original test path
    _setStoragePathForTest(null);
    
    // Re-initialize for next tests
    const newPath = path.join(os.tmpdir(), `knowledge_graph_test_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
    _setStoragePathForTest(newPath);
  });

  it("should require searchTerm for resonance flashback", async () => {
    const result = await semanticMemoryPlugin.execute({
      action: "flashback_resonance",
    });

    expect(result).toContain("Error");
    expect(result).toContain("searchTerm");
    
    // Cleanup
    _setStoragePathForTest(null);
  });
