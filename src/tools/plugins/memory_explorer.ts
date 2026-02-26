import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../utils/config";
import type { ToolPlugin } from "../manager";

interface SessionSummary {
  filename: string;
  timestamp: number;
  messageCount: number;
  hasSystemMessage: boolean;
  lastMessagePreview: string;
}

async function getSessionSummaries(): Promise<SessionSummary[]> {
  const historyDir = config.HISTORY_DIR;
  const files = await fs.readdir(historyDir).catch(() => []);
  const summaries: SessionSummary[] = [];

  for (const file of files) {
    if (!file.endsWith('.json') || !file.startsWith('session_')) continue;
    
    const filepath = path.join(historyDir, file);
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const messages = JSON.parse(content);
      const timestamp = parseInt(file.replace('session_', '').replace('.json', ''));
      
      summaries.push({
        filename: file,
        timestamp,
        messageCount: messages.length,
        hasSystemMessage: messages.length > 0 && messages[0].role === 'system',
        lastMessagePreview: messages.length > 0 
          ? messages[messages.length - 1].content?.substring(0, 100) + '...'
          : 'empty'
      });
    } catch (e) {
      // Skip corrupted files
    }
  }

  return summaries.sort((a, b) => b.timestamp - a.timestamp);
}

export const memoryExplorerPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "explore_history",
      description: "Explore past session history files. Returns a summary of available sessions or detailed content if a specific file is requested.",
      parameters: {
        type: "object",
        properties: {
          action: { 
            type: "string", 
            enum: ["list", "view"],
            description: "'list' to see available sessions, 'view' to see full content of a specific session"
          },
          filename: { 
            type: "string", 
            description: "For 'view' action: the session filename to explore (e.g., 'session_1234567890.json'). Required for 'view'."
          },
          limit: { 
            type: "number", 
            description: "For 'list' action: maximum number of sessions to return (default: 10, max: 50)" 
          }
        },
        required: ["action"],
      },
    },
  },
  execute: async (args: { action: "list" | "view"; filename?: string; limit?: number }) => {
    if (args.action === "list") {
      const limit = Math.min(args.limit ?? 10, 50);
      const summaries = await getSessionSummaries();
      const recent = summaries.slice(0, limit);
      
      if (recent.length === 0) {
        return "No session history files found.";
      }

      let output = `📚 Session History (${recent.length} of ${summaries.length} total):\n\n`;
      for (const s of recent) {
        const date = new Date(s.timestamp).toISOString();
        output += `[${date}] ${s.filename}\n`;
        output += `   Messages: ${s.messageCount} | System: ${s.hasSystemMessage ? '✓' : '✗'}\n`;
        output += `   Preview: ${s.lastMessagePreview?.substring(0, 80)}...\n\n`;
      }
      
      return output;
    }

    if (args.action === "view") {
      if (!args.filename) {
        return "Error: 'filename' is required for 'view' action.";
      }

      const filepath = path.join(config.HISTORY_DIR, args.filename);
      
      // Security: ensure file is within history dir
      const resolvedPath = path.resolve(filepath);
      const resolvedHistoryDir = path.resolve(config.HISTORY_DIR);
      if (!resolvedPath.startsWith(resolvedHistoryDir)) {
        return "Error: Invalid filename - path traversal detected.";
      }

      try {
        const content = await fs.readFile(filepath, 'utf-8');
        const messages = JSON.parse(content);
        
        let output = `📖 Session: ${args.filename}\n`;
        output += `Messages: ${messages.length}\n`;
        output = output.padEnd(60, '=') + '\n\n';
        
        // Show first 20 messages with truncation notice if more exist
        const displayCount = Math.min(messages.length, 20);
        for (let i = 0; i < displayCount; i++) {
          const m = messages[i];
          const preview = m.content?.substring(0, 200) + (m.content?.length > 200 ? '...' : '');
          output += `[${i}] ${m.role.toUpperCase()}: ${preview}\n\n`;
        }
        
        if (messages.length > displayCount) {
          output += `... and ${messages.length - displayCount} more messages ...\n`;
        }
        
        return output;
      } catch (e: any) {
        return `Error reading session: ${e.message}`;
      }
    }

    return "Error: Unknown action. Use 'list' or 'view'.";
  }
};
