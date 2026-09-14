const fs = require("fs");
const path = require("path");

function getFigmaToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN;
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("FIGMA_TOKEN=")) {
        return trimmed.substring("FIGMA_TOKEN=".length).trim();
      }
    }
  }
  throw new Error("FIGMA_TOKEN not found in environment or .env file");
}

function parseFileKey(input) {
  if (!input) throw new Error("File key or URL required");
  const match = input.match(/design\/([a-zA-Z0-9]+)/) || input.match(/file\/([a-zA-Z0-9]+)/);
  return match ? match[1] : input;
}

async function figmaApi(endpoint) {
  const token = getFigmaToken();
  const res = await fetch(`https://api.figma.com/v1/${endpoint}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Figma API error (${res.status}): ${errorText}`);
  }
  return res.json();
}

async function main() {
  const [cmd, arg1, arg2] = process.argv.slice(2);
  if (!cmd || cmd === "me") {
    const me = await figmaApi("me");
    console.log("Figma Authenticated User:", JSON.stringify(me, null, 2));
  } else if (cmd === "file") {
    const fileKey = parseFileKey(arg1);
    const file = await figmaApi(`files/${fileKey}?depth=2`);
    console.log(`Figma File: ${file.name} (Key: ${fileKey})`);
    console.log("Pages & Frames:");
    for (const page of file.document.children || []) {
      console.log(`- Page: ${page.name} (${page.id})`);
      for (const child of page.children || []) {
        console.log(`    [${child.type}] ${child.name} (${child.id})`);
      }
    }
  } else {
    console.log("Usage: node figma-sync.js [me | file <key/url>]");
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
