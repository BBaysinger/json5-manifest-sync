import { spawnSync } from "child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const suppressBlankCommentWarning = process.argv.includes(
  "--suppress-blank-comment-warning",
);

function runNpmScript(scriptName, extraArgs = []) {
  const result = spawnSync(
    npmCommand,
    ["run", scriptName, "--", ...extraArgs],
    {
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runNpmScript("format");
runNpmScript("sync:json5");
runNpmScript(
  "warn:blank-comments",
  suppressBlankCommentWarning ? ["--suppress-blank-comment-warning"] : [],
);
