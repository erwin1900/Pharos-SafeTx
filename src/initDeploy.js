import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_NAME = "pharos-safetx";
const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DEFAULT_OUTPUT_DIR = "dist/agent-deploy";
const TARGETS = ["codex", "chatgpt", "mcp", "claude", "cursor"];

export async function initDeployment(options = {}) {
  const target = options.target || "all";
  const outputDir = path.resolve(ROOT_DIR, options.outputDir || DEFAULT_OUTPUT_DIR);
  const selectedTargets = target === "all" ? TARGETS : [target];

  for (const item of selectedTargets) {
    if (!TARGETS.includes(item)) {
      throw new Error(`Unsupported init target: ${item}. Use one of: all, ${TARGETS.join(", ")}`);
    }
  }

  await fs.mkdir(outputDir, { recursive: true });
  const written = [];

  for (const item of selectedTargets) {
    if (item === "codex") {
      written.push(...(await writeCodexSkill(outputDir)));
    }
    if (item === "chatgpt") {
      written.push(...(await writeChatGptPackage(outputDir)));
    }
    if (item === "mcp") {
      written.push(...(await writeMcpConfig(outputDir)));
    }
    if (item === "claude") {
      written.push(...(await writeClaudePackage(outputDir)));
    }
    if (item === "cursor") {
      written.push(...(await writeCursorPackage(outputDir)));
    }
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  await writeJson(manifestPath, {
    name: PROJECT_NAME,
    generatedAt: new Date().toISOString(),
    outputDir: path.relative(ROOT_DIR, outputDir),
    targets: selectedTargets,
    files: written.map((file) => path.relative(ROOT_DIR, file))
  });
  written.push(manifestPath);

  return {
    outputDir,
    targets: selectedTargets,
    files: written
  };
}

export function getInitTargets() {
  return ["all", ...TARGETS];
}

async function writeCodexSkill(outputDir) {
  const targetDir = path.join(outputDir, "codex", PROJECT_NAME);
  await fs.mkdir(targetDir, { recursive: true });
  const skill = await fs.readFile(path.join(ROOT_DIR, "codex-skill", PROJECT_NAME, "SKILL.md"), "utf8");
  const skillPath = path.join(targetDir, "SKILL.md");
  const installPath = path.join(targetDir, "INSTALL.md");

  await fs.writeFile(skillPath, skill);
  await fs.writeFile(
    installPath,
    `# Install Codex Skill\n\nCopy this folder to your Codex skills directory:\n\n\`\`\`bash\nmkdir -p "$HOME/.codex/skills/${PROJECT_NAME}"\ncp SKILL.md "$HOME/.codex/skills/${PROJECT_NAME}/SKILL.md"\n\`\`\`\n\nThen restart or reload Codex and trigger with:\n\n\`\`\`text\n$pharos-safetx run demo\n\`\`\`\n`
  );

  return [skillPath, installPath];
}

async function writeChatGptPackage(outputDir) {
  const targetDir = path.join(outputDir, "chatgpt");
  await fs.mkdir(targetDir, { recursive: true });
  const instructionsPath = path.join(targetDir, "instructions.md");
  const actionsPath = path.join(targetDir, "actions-openapi.json");
  const readmePath = path.join(targetDir, "README.md");

  await fs.writeFile(
    instructionsPath,
    `# Pharos SafeTx Custom GPT Instructions\n\nYou are Pharos SafeTx, an AI x RealFi pre-signing safety assistant. Your job is to analyze Pharos/EVM transaction payloads before a wallet signs them.\n\nRules:\n\n- Never ask for private keys, seed phrases, or wallet secrets.\n- Never claim to sign or broadcast a transaction.\n- Ask the user for the exact \`to\`, \`value\`, \`calldata\`, \`chainId\`, and natural-language intent.\n- If an action is available, call \`POST /analyze\` before giving signing guidance.\n- Treat \`ALLOW\` as permission to continue only if the user/session policy allows signing.\n- Treat \`WARN\` as a human confirmation point.\n- Treat \`BLOCK\` as a refusal to sign and explain the reasons.\n- Prefer limited approvals and policy whitelists for RealFi workflows.\n`
  );

  await writeJson(actionsPath, buildOpenApiSpec());
  await fs.writeFile(
    readmePath,
    `# ChatGPT Custom GPT Setup\n\nUse \`instructions.md\` as the GPT instruction text.\n\nUse \`actions-openapi.json\` as the Action schema after hosting the SafeTx HTTP adapter behind a public HTTPS URL.\n\nLocal development command:\n\n\`\`\`bash\nnpm run http\n\`\`\`\n\nFor production, replace \`https://YOUR-SAFETX-HOST.example.com\` in the OpenAPI server URL with your deployed HTTPS endpoint.\n`
  );

  return [instructionsPath, actionsPath, readmePath];
}

async function writeMcpConfig(outputDir) {
  const targetDir = path.join(outputDir, "mcp");
  await fs.mkdir(targetDir, { recursive: true });
  const configPath = path.join(targetDir, "mcp-server.json");
  const readmePath = path.join(targetDir, "README.md");

  await writeJson(configPath, {
    mcpServers: {
      "pharos-safetx": {
        command: "node",
        args: [path.join(ROOT_DIR, "src", "mcp-server.js")]
      }
    }
  });
  await fs.writeFile(
    readmePath,
    `# MCP Setup\n\nUse \`mcp-server.json\` as a template for MCP-compatible clients.\n\nSmoke test:\n\n\`\`\`bash\nprintf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\\n' | node src/mcp-server.js\n\`\`\`\n\nThe server exposes SafeTx tools and read-only resources for schemas, references, and examples.\n`
  );

  return [configPath, readmePath];
}

async function writeClaudePackage(outputDir) {
  const targetDir = path.join(outputDir, "claude");
  await fs.mkdir(targetDir, { recursive: true });
  const skillPath = path.join(targetDir, "CLAUDE_SKILL.md");
  const mcpPath = path.join(targetDir, "claude_desktop_config.json");

  await fs.writeFile(
    skillPath,
    `# Pharos SafeTx Claude Skill\n\nUse Pharos SafeTx before any Pharos/EVM transaction signing recommendation.\n\nWorkflow:\n\n1. Read the user's natural-language intent.\n2. Collect the exact transaction payload: \`chainId\`, \`from\`, \`to\`, \`value\`, \`calldata\`.\n3. Call the MCP tool \`pharos_safetx_analyze_transaction\`.\n4. Explain \`ALLOW\`, \`WARN\`, or \`BLOCK\` with findings and safer alternatives.\n5. Never request private keys and never sign or broadcast.\n`
  );
  await writeJson(mcpPath, {
    mcpServers: {
      "pharos-safetx": {
        command: "node",
        args: [path.join(ROOT_DIR, "src", "mcp-server.js")]
      }
    }
  });

  return [skillPath, mcpPath];
}

async function writeCursorPackage(outputDir) {
  const targetDir = path.join(outputDir, "cursor");
  await fs.mkdir(targetDir, { recursive: true });
  const rulesPath = path.join(targetDir, "pharos-safetx.mdc");
  const mcpPath = path.join(targetDir, "mcp.json");

  await fs.writeFile(
    rulesPath,
    `---\ndescription: Use Pharos SafeTx to review AI-generated Pharos/EVM transactions before signing.\nglobs:\n  - "**/*.json"\n  - "**/*.js"\n  - "**/*.ts"\n---\n\n# Pharos SafeTx\n\nBefore recommending a wallet signature, run SafeTx analysis on the exact transaction payload. Never ask for private keys. Treat BLOCK as a refusal to sign and WARN as a user-confirmation point.\n`
  );
  await writeJson(mcpPath, {
    mcpServers: {
      "pharos-safetx": {
        command: "node",
        args: [path.join(ROOT_DIR, "src", "mcp-server.js")]
      }
    }
  });

  return [rulesPath, mcpPath];
}

function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Pharos SafeTx API",
      version: "0.1.0",
      description: "Pre-signing transaction safety analysis for AI x RealFi agents."
    },
    servers: [
      {
        url: "https://YOUR-SAFETX-HOST.example.com",
        description: "Replace with your deployed SafeTx HTTPS endpoint."
      }
    ],
    paths: {
      "/analyze": {
        post: {
          operationId: "analyzeTransaction",
          summary: "Analyze a proposed Pharos/EVM transaction before signing.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SafeTxRequest"
                }
              }
            }
          },
          responses: {
            "200": {
              description: "SafeTx decision and findings.",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SafeTxResult"
                  }
                }
              }
            }
          }
        }
      },
      "/explain": {
        post: {
          operationId: "explainRisk",
          summary: "Explain SafeTx risk findings.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SafeTxRequest"
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Compact risk explanation."
            }
          }
        }
      },
      "/suggest": {
        post: {
          operationId: "suggestSafeAction",
          summary: "Suggest the safest next action for the agent.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SafeTxRequest"
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Agent action and safer alternative."
            }
          }
        }
      }
    },
    components: {
      schemas: {
        SafeTxRequest: readJsonSync("schemas/safetx-request.schema.json"),
        SafeTxResult: readJsonSync("schemas/safetx-result.schema.json")
      }
    }
  };
}

function readJsonSync(relativePath) {
  const data = JSON.parse(fsSync.readFileSync(path.join(ROOT_DIR, relativePath), "utf8"));
  delete data.$schema;
  delete data.$id;
  return data;
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}
