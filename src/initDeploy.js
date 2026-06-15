import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_NAME = "pharos-safetx";
const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DEFAULT_OUTPUT_DIR = "dist/agent-deploy";
const TARGETS = ["codex"];

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
  const skill = await fs.readFile(path.join(ROOT_DIR, "SKILL.md"), "utf8");
  const skillPath = path.join(targetDir, "SKILL.md");
  const installPath = path.join(targetDir, "INSTALL.md");

  await fs.writeFile(skillPath, skill);
  await fs.writeFile(
    installPath,
    `# Install Codex Skill\n\nCopy this folder to your Codex skills directory:\n\n\`\`\`bash\nmkdir -p "$HOME/.codex/skills/${PROJECT_NAME}"\ncp SKILL.md "$HOME/.codex/skills/${PROJECT_NAME}/SKILL.md"\n\`\`\`\n\nThen restart or reload Codex and trigger with:\n\n\`\`\`text\n$pharos-safetx run demo\n\`\`\`\n`
  );

  return [skillPath, installPath];
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}
