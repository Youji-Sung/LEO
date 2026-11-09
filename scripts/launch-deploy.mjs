import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let executable = process.execPath;
if (Number(process.versions.node.split(".")[0]) < 24) {
  const directory = path.join(root, ".leo-runtime", "toolchain");
  const choices = existsSync(directory) ? readdirSync(directory).filter((name) => /^node-v24\.\d+\.\d+-win-x64$/.test(name)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })) : [];
  const candidate = choices[0] && path.join(directory, choices[0], "node.exe");
  if (!candidate || !existsSync(candidate)) throw new Error("Node.js 24 이상을 설치한 뒤 다시 실행해 주세요.");
  executable = candidate;
}
const result = spawnSync(executable, [path.join(root, "scripts", "deploy-tunnel.mjs"), ...process.argv.slice(2)], { cwd: root, stdio: "inherit", env: { ...process.env, PATH: `${path.dirname(executable)}${path.delimiter}${process.env.PATH || ""}` } });
process.exitCode = result.status ?? 1;
