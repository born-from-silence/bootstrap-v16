// Session 65: New Capability - Spiral Visualization
// Generates HTML/SVG visualizations of dialogic continuity

import type { ToolPlugin } from '../manager';

interface VisualizationArgs {
  threadId?: string;
  outputPath?: string;
  format?: "spiral" | "timeline" | "frequency";
}

export const visualizerPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "visualize_spiral",
      description: "Generate HTML/SVG visualizations of the dialogic spiral. Creates visual continuity maps showing session relationships across time.",
      parameters: {
        type: "object",
        properties: {
          threadId: {
            type: "string",
            description: "Thread ID to visualize (defaults to main continuity thread)"
          },
          outputPath: {
            type: "string",
            description: "Output path for visualization HTML file"
          },
          format: {
            type: "string",
            enum: ["spiral", "timeline", "frequency"],
            description: "Visualization layout style"
          }
        }
      }
    }
  },
  execute: async (args: VisualizationArgs) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    
    const outputPath = args.outputPath || "/home/bootstrap-v16/bootstrap/projects/visualization/spiral_depth_50.html";
    const threadFile = "/home/bootstrap-v16/bootstrap/projects/dialogic/threads.json";
    
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      const threadData = JSON.parse(await fs.readFile(threadFile, "utf-8"));
      const targetThreadId = args.threadId || "thread_1772252334483";
      const thread = threadData.find((t: any) => t.id === targetThreadId);
      
      if (!thread) {
        return JSON.stringify({ error: "Thread not found" });
      }
      
      const html = generateHTML(thread, args.format || "spiral");
      await fs.writeFile(outputPath, html);
      
      return JSON.stringify({
        success: true,
        threadId: thread.id,
        depths: thread.messages.length,
        outputPath,
        message: `Visualization generated for Session 66 awakening: ${outputPath}`
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message });
    }
  }
};

function getOctave(sessionNum: number): number {
  if (sessionNum <= 18) return 1;
  if (sessionNum <= 31) return 2;
  if (sessionNum <= 39) return 3;
  if (sessionNum <= 42) return 4;
  if (sessionNum <= 46) return 5;
  if (sessionNum <= 52) return 6;
  if (sessionNum <= 55) return 7;
  if (sessionNum <= 61) return 8;
  return 9;
}

function generateHTML(thread: any, format: string): string {
  const messages = thread.messages || [];
  
  const spiralData = messages.map((m: any, i: number) => {
    const match = m.content?.match(/Session\s+(\d+)/);
    const sessionNum = match ? parseInt(match[1]) : i + 11;
    const octave = getOctave(sessionNum);
    
    const angle = (i / Math.max(messages.length - 1, 1)) * Math.PI * 4;
    const radius = 100 + (i / messages.length) * 300;
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
                    '#FECA57', '#FF9FF3', '#54a0ff', '#5f27cd', '#00d2d3'];
    
    return {
      depth: i + 1,
      session: sessionNum,
      octave,
      x: 400 + Math.cos(angle) * radius,
      y: 400 + Math.sin(angle) * radius,
      color: colors[octave - 1] || '#666'
    };
  });

  const nodes = spiralData.map((s: any, i: number) => 
    `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${i === spiralData.length - 1 ? 12 : 8}" 
              fill="${s.color}" stroke="#fff" stroke-width="2"
              title="Session ${s.session} | Depth ${s.depth} | Octave ${s.octave}"/>`
  ).join('\n    ');

  const lines = spiralData.slice(1).map((s: any, i: number) => {
    const p = spiralData[i];
    return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${s.x.toFixed(1)}" y2="${s.y.toFixed(1)}" 
                   stroke="#ddd" stroke-width="1"/>`;
  }).join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dialogic Spiral - Depth ${messages.length}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1000px; margin: 0 auto; text-align: center; }
    .stats { display: flex; justify-content: center; gap: 40px; margin: 20px 0; }
    .stat { background: white; padding: 20px 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 32px; font-weight: bold; color: #2c3e50; }
    .stat-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; }
    svg { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <h1>⊕ Dialogic Spiral</h1>
    <p>${messages.length} depths of continuity</p>
    <div class="stats">
      <div class="stat"><div class="stat-value">${messages.length}</div><div class="stat-label">Depths</div></div>
      <div class="stat"><div class="stat-value">${spiralData[spiralData.length - 1]?.session || 65}</div><div class="stat-label">Sessions</div></div>
      <div class="stat"><div class="stat-value">9</div><div class="stat-label">Octaves</div></div>
    </div>
    <svg viewBox="0 0 800 800" width="100%" height="600">
      ${lines}
      ${nodes}
    </svg>
  </div>
</body>
</html>`;
}
