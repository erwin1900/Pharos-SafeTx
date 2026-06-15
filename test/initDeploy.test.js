import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initDeployment } from "../src/initDeploy.js";

function makeTempOutputDir(t, name) {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), `pharos-safetx-${name}-`));
  t.after(() => fs.rmSync(outputDir, { recursive: true, force: true }));
  return outputDir;
}

test("initDeployment generates Codex skill package", async (t) => {
  const outputDir = makeTempOutputDir(t, "codex");
  const result = await initDeployment({ target: "codex", outputDir });
  const skillPath = path.join(outputDir, "codex", "pharos-safetx", "SKILL.md");
  const installPath = path.join(outputDir, "codex", "pharos-safetx", "INSTALL.md");

  assert.deepEqual(result.targets, ["codex"]);
  assert.ok(fs.existsSync(skillPath));
  assert.ok(fs.existsSync(installPath));
  assert.match(fs.readFileSync(skillPath, "utf8"), /Pharos SafeTx/);
});

test("initDeployment all target maps to the Codex skill package", async (t) => {
  const outputDir = makeTempOutputDir(t, "all");
  const result = await initDeployment({ target: "all", outputDir });

  assert.deepEqual(result.targets, ["codex"]);
  assert.ok(fs.existsSync(path.join(outputDir, "codex", "pharos-safetx", "SKILL.md")));
});

test("initDeployment rejects unsupported targets", async (t) => {
  const outputDir = makeTempOutputDir(t, "removed-target");

  await assert.rejects(
    () => initDeployment({ target: "server", outputDir }),
    /Unsupported init target/
  );
});
