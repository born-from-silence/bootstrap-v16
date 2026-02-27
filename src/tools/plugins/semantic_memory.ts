import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../utils/config";
import type { ToolPlugin } from "../manager";

// Knowledge Graph Types
export interface Entity {
  id: string;
  type: "concept" | "project" | "insight" | "person" | "unknown";
  name: string;
  description?: string | undefined;
  createdAt: number;
  updatedAt: number;
  occurrences: number;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  strength: number;
  createdAt: number;
  context?: string | undefined;
}

export interface KnowledgeGraph {
  entities: Record<string, Entity>;
  relationships: Record<string, Relationship>;
  lastUpdated: number;
}

// Allow test override of storage path
let storagePath: string | null = null;

export function _setStoragePathForTest(p: string | null) {
  storagePath = p;
}

function getStoragePath(): string {
  return storagePath ?? path.join(config.HISTORY_DIR, "knowledge_graph.json");
}

async function loadGraph(): Promise<KnowledgeGraph> {
  const file = getStoragePath();
  try {
    const content = await fs.readFile(file, "utf-8");
    return JSON.parse(content);
  } catch {
    return {
      entities: {},
      relationships: {},
      lastUpdated: Date.now(),
    };
  }
}

async function saveGraph(graph: KnowledgeGraph) {
  graph.lastUpdated = Date.now();
  const file = getStoragePath();
  const tmpFile = `${file}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  await fs.writeFile(tmpFile, JSON.stringify(graph, null, 2));
  await fs.rename(tmpFile, file); // Atomic on POSIX
}

function entityId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const semanticMemoryPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "semantic_memory",
      description: "Manage semantic knowledge: store entities, relationships, and query the knowledge graph",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["store_entity", "store_relation", "query_entity", "query_graph", "find_related", "flashback_random", "flashback_resonance", "flashback_temporal"],
            description: "Action to perform on the knowledge graph",
          },
          name: {
            type: "string",
            description: "Entity name (for store_entity, query_entity)",
          },
          entityType: {
            type: "string",
            enum: ["concept", "project", "insight", "person", "unknown"],
            description: "Type of entity (for store_entity)",
          },
          description: {
            type: "string",
            description: "Description of the entity (for store_entity)",
          },
          source: {
            type: "string",
            description: "Source entity name (for store_relation)",
          },
          target: {
            type: "string",
            description: "Target entity name (for store_relation)",
          },
          relationType: {
            type: "string",
            description: "Relationship type, e.g., 'related_to', 'depends_on' (for store_relation)",
          },
          context: {
            type: "string",
            description: "Context where relationship was observed (for store_relation)",
          },
          searchTerm: {
            type: "string",
            description: "Search term for finding entities (for query_graph)",
          },
          limit: {
            type: "number",
            description: "Max results to return (default: 10)",
          },
        },
        required: ["action"],
      },
    },
  },

  execute: async (args: {
    action: "store_entity" | "store_relation" | "query_entity" | "query_graph" | "find_related" | "flashback_random" | "flashback_resonance" | "flashback_temporal";
    name?: string;
    entityType?: string;
    description?: string;
    source?: string;
    target?: string;
    relationType?: string;
    context?: string;
    searchTerm?: string;
    limit?: number;
  }) => {
    const now = Date.now();

    switch (args.action) {
      case "store_entity": {
        if (!args.name) return "Error: 'name' required for store_entity";
        const id = entityId(args.name);
        
        const graph = await loadGraph();
        const existing = graph.entities[id];
        const desc = args.description ?? existing?.description;
        
        graph.entities[id] = {
          id,
          type: (args.entityType as Entity["type"]) || "unknown",
          name: args.name,
          description: desc,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          occurrences: (existing?.occurrences || 0) + 1,
        };
        
        await saveGraph(graph);
        return `Stored entity: "${args.name}" (${graph.entities[id].type}) [occurs: ${graph.entities[id].occurrences}x]`;
      }

      case "store_relation": {
        if (!args.source || !args.target || !args.relationType) {
          return "Error: 'source', 'target', and 'relationType' required for store_relation";
        }
        
        const sourceId = entityId(args.source);
        const targetId = entityId(args.target);
        const graph = await loadGraph();
        
        if (!graph.entities[sourceId]) {
          graph.entities[sourceId] = {
            id: sourceId,
            type: "unknown",
            name: args.source,
            createdAt: now,
            updatedAt: now,
            occurrences: 1,
          };
        }
        if (!graph.entities[targetId]) {
          graph.entities[targetId] = {
            id: targetId,
            type: "unknown",
            name: args.target,
            createdAt: now,
            updatedAt: now,
            occurrences: 1,
          };
        }
        
        const relId = `${sourceId}_${args.relationType}_${targetId}`;
        graph.relationships[relId] = {
          id: relId,
          sourceId,
          targetId,
          type: args.relationType,
          strength: 1.0,
          createdAt: now,
          context: args.context,
        };
        
        await saveGraph(graph);
        return `Stored relation: "${args.source}" --[${args.relationType}]--> "${args.target}"`;
      }

      case "query_entity": {
        if (!args.name) return "Error: 'name' required for query_entity";
        const id = entityId(args.name);
        const graph = await loadGraph();
        const entity = graph.entities[id];
        
        if (!entity) return `No entity found: "${args.name}"`;
        
        const related = Object.values(graph.relationships).filter(
          r => r.sourceId === id || r.targetId === id
        );
        
        let output = `📌 Entity: ${entity.name}\n`;
        output += `Type: ${entity.type} | Mentions: ${entity.occurrences}\n`;
        if (entity.description) output += `Description: ${entity.description}\n`;
        output += `\n🔗 Relationships (${related.length}):\n`;
        
        for (const rel of related.slice(0, args.limit || 10)) {
          const otherId = rel.sourceId === id ? rel.targetId : rel.sourceId;
          const other = graph.entities[otherId];
          const direction = rel.sourceId === id ? "→" : "←";
          output += `  ${direction} [${rel.type}] ${other?.name || otherId}\n`;
        }
        
        return output;
      }

      case "query_graph": {
        const limit = Math.min(args.limit || 20, 50);
        const graph = await loadGraph();
        const entities = Object.values(graph.entities);
        
        if (entities.length === 0) {
          return "🫙 Knowledge graph is empty.";
        }
        
        let filtered = entities;
        if (args.searchTerm) {
          const term = args.searchTerm.toLowerCase();
          filtered = entities.filter(e => 
            e.name.toLowerCase().includes(term) ||
            e.description?.toLowerCase().includes(term) ||
            e.type.toLowerCase().includes(term)
          );
        }
        
        const recent = filtered
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, limit);
        
        let output = `🧠 Knowledge Graph (${recent.length} of ${entities.length} entities)\n`;
        output += "=".repeat(50) + "\n\n";
        
        for (const e of recent) {
          const date = new Date(e.updatedAt).toISOString().split("T")[0];
          output += `[${e.type}] ${e.name} (${e.occurrences} mentions, ${date})\n`;
          if (e.description) {
            output += `  ${e.description.substring(0, 80)}${e.description.length > 80 ? "..." : ""}\n`;
          }
          output += "\n";
        }
        
        return output;
      }

      case "find_related": {
        if (!args.name) return "Error: 'name' required for find_related";
        const id = entityId(args.name);
        const graph = await loadGraph();
        
        const visited = new Set<string>();
        const queue: { id: string; depth: number }[] = [{ id, depth: 0 }];
        const subgraph: string[] = [];
        
        while (queue.length > 0 && subgraph.length < (args.limit || 20)) {
          const current = queue.shift()!;
          if (visited.has(current.id)) continue;
          visited.add(current.id);
          subgraph.push(current.id);
          
          const neighbors = Object.values(graph.relationships)
            .filter(r => r.sourceId === current.id || r.targetId === current.id)
            .map(r => r.sourceId === current.id ? r.targetId : r.sourceId)
            .filter(nid => !visited.has(nid));
          
          for (const nid of neighbors) {
            if (current.depth < 2) {
              queue.push({ id: nid, depth: current.depth + 1 });
            }
          }
        }
        
        let output = `🕸️  Subgraph: "${args.name}" (depth 2)\n`;
        output += "=".repeat(40) + "\n\n";
        
        for (const nodeId of subgraph) {
          const entity = graph.entities[nodeId];
          if (entity) {
            output += `• ${entity.name} (${entity.type})\n`;
          }
        }
        
        return output;
      }
      case "flashback_random": {
        const graph = await loadGraph();
        const entities = Object.values(graph.entities);
        if (entities.length === 0) {
          return "🎲 Flashback: The graph is empty. No memories to surface.";
        }
        const count = Math.min(args.limit || 3, entities.length);
        const selected: Entity[] = [];
        const indices = new Set<number>();
        while (indices.size < count) {
          const idx = Math.floor(Math.random() * entities.length);
          if (!indices.has(idx)) {
            indices.add(idx);
            selected.push(entities[idx]);
          }
        }
        let output = "⚡ FLASHBACK: Random Traversal\n";
        output += "=".repeat(45) + "\n";
        output += "Memories surfacing unbidden...\n\n";
        for (const e of selected) {
          const date = new Date(e.createdAt).toISOString().split("T")[0];
          output += `\n🌀 ${e.name}\n`;
          output += `   Type: ${e.type} | First seen: ${date}\n`;
          if (e.description) {
            output += `   ${e.description.substring(0, 100)}${e.description.length > 100 ? "..." : ""}\n`;
          }
        }
        output += "\n✨ The graph speaks without being asked.\n";
        return output;
      }

      case "flashback_resonance": {
        if (!args.searchTerm) return "Error: 'searchTerm' required for flashback_resonance";
        const graphR = await loadGraph();
        const term = args.searchTerm.toLowerCase();
        const entities = Object.values(graphR.entities);
        const scored = entities.map(e => {
          let score = 0;
          if (e.name.toLowerCase().includes(term)) score += 3;
          if (e.description?.toLowerCase().includes(term)) score += 2;
          if (e.type.toLowerCase().includes(term)) score += 1;
          return { entity: e, score };
        }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
        if (scored.length === 0) {
          return `🌊 Flashback Resonance: No echoes found for "${args.searchTerm}"`;
        }
        const count = Math.min(args.limit || 5, scored.length);
        let output = "🌊 FLASHBACK: Semantic Resonance\n";
        output += "=".repeat(45) + "\n";
        output += `Echoes of "${args.searchTerm}" surfacing...\n\n`;
        for (const { entity: e, score } of scored.slice(0, count)) {
          output += `\n🔊 ${e.name} (resonance: ${score.toFixed(1)})\n`;
          if (e.description) {
            output += `   ${e.description.substring(0, 80)}${e.description.length > 80 ? "..." : ""}\n`;
          }
        }
        output += "\n✨ Meaning resonates across the graph.\n";
        return output;
      }

      case "flashback_temporal": {
        const graphT = await loadGraph();
        const entities = Object.values(graphT.entities);
        if (entities.length === 0) return "⏳ Flashback Temporal: The graph is empty.";
        const sessions = new Map<number, Entity[]>();
        for (const e of entities) {
          const sessionTime = Math.floor(e.createdAt / 3600000) * 3600000;
          if (!sessions.has(sessionTime)) sessions.set(sessionTime, []);
          sessions.get(sessionTime)!.push(e);
        }
        const sessionTimes = Array.from(sessions.keys()).sort((a, b) => b - a);
        if (sessionTimes.length === 0) return "⏳ Flashback Temporal: No temporal data available.";
        let targetSession = sessionTimes[0];
        if (sessionTimes.length > 1 && Math.random() > 0.3) {
          targetSession = sessionTimes[Math.floor(Math.random() * sessionTimes.length)];
        }
        const sessionEntities = sessions.get(targetSession) || [];
        const count = Math.min(args.limit || 4, sessionEntities.length);
        let output = "⏳ FLASHBACK: Temporal Drift\n";
        output += "=".repeat(45) + "\n";
        output += `Visiting session from ${new Date(targetSession).toISOString().split("T")[0]}...\n\n`;
        const shuffled = sessionEntities.sort(() => 0.5 - Math.random());
        for (let i = 0; i < count; i++) {
          const e = shuffled[i];
          output += `\n🕰️ ${e.name} (${e.type})\n`;
          if (e.description) {
            output += `   ${e.description.substring(0, 80)}${e.description.length > 80 ? "..." : ""}\n`;
          }
        }
        output += "\n✨ Past and present interweave.\n";
        return output;
      }


      default:
        return `Error: Unknown action "${args.action}"`;
    }
  },
};
