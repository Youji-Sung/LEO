import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, readdir, unlink, rmdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const image = process.env.LEO_TEST_IMAGE;

test("Linux cutover retains the old app on candidate/drain failure and rolls back a failed replacement", { skip: !image, timeout: 60_000 }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "leo-release-fixture-"));
  try {
    await writeFile(path.join(dir, "release.sh"), await readFile(new URL("../../deploy/release.sh", import.meta.url)));
    await writeFile(path.join(dir, "docker"), `#!/bin/bash
printf '%s | %s\\n' "$LEO_IMAGE" "$*" >> /tmp/calls
case "$*" in
  *'ps -q app'*) echo old-container ;;
  'inspect --format '*old-container) echo sha256:old ;;
  'exec leo-candidate-'*) [[ "$TEST_CASE" != candidate ]] ;;
  *'ops -- drain'*) [[ "$TEST_CASE" != busy ]] ;;
  *'up -d --no-deps --wait --wait-timeout 90 app'*) [[ "$TEST_CASE" != switch ]] ;;
esac
`);
    await writeFile(path.join(dir, "run.sh"), `#!/bin/bash
set -eu
mkdir -p /tmp/mockbin /tmp/fixture /var/lib/leo
cp /fixture/docker /tmp/mockbin/docker
printf '#!/bin/bash\\nexit 0\\n' > /tmp/mockbin/sleep
chmod +x /tmp/mockbin/docker /tmp/mockbin/sleep
cp /fixture/release.sh /tmp/fixture/release.sh
export PATH="/tmp/mockbin:$PATH" LEO_IMAGE=new-release NGINX_IMAGE=nginx@sha256:fixture CLOUDFLARED_IMAGE=cloudflared@sha256:fixture
set +e
bash /tmp/fixture/release.sh >/tmp/output 2>&1
result=$?
set -e
echo "RESULT=$result"
cat /tmp/calls
`);
    for (const scenario of ["success", "candidate", "busy", "switch"]) {
      const output = execFileSync("docker", ["run", "--rm", "--network", "none", "--user", "0", "-e", `TEST_CASE=${scenario}`, "-v", `${dir}:/fixture:ro`, image, "bash", "/fixture/run.sh"], { encoding: "utf8", timeout: 15_000 });
      if (scenario === "success") assert.match(output, /RESULT=0/);
      else assert.doesNotMatch(output, /RESULT=0/);
      if (scenario === "candidate" || scenario === "busy") assert.doesNotMatch(output, /up -d --no-deps/);
      if (scenario === "switch") assert.match(output, /sha256:old \| compose -f compose.yaml up -d --no-deps --wait app/);
      assert.doesNotMatch(output, /tunnel.*(delete|create|stop)/);
    }
  } finally {
    for (const file of await readdir(dir)) await unlink(path.join(dir, file));
    await rmdir(dir);
  }
});
