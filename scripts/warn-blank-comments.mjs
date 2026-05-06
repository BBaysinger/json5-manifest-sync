import fs from "fs";
import path from "path";

const targetPath = path.resolve(process.cwd(), "package.json5");
const suppressWarning = process.argv.includes(
  "--suppress-blank-comment-warning",
);

if (!fs.existsSync(targetPath)) {
  process.exit(0);
}

const lines = fs.readFileSync(targetPath, "utf8").split("\n");
const blankCommentLines = lines
  .map((line, index) => ({ line, lineNumber: index + 1 }))
  .filter(({ line }) => /^\s*\/\/\s*$/.test(line))
  .map(({ lineNumber }) => lineNumber);

if (blankCommentLines.length === 0) {
  process.exit(0);
}

if (suppressWarning) {
  process.exit(0);
}

const preview = blankCommentLines.slice(0, 8).join(", ");
const remainder = blankCommentLines.length > 8 ? ", ..." : "";
const plural = blankCommentLines.length === 1 ? "placeholder" : "placeholders";

console.warn(
  `[warn:blank-comments] package.json5 contains ${blankCommentLines.length} blank comment ${plural} at line${blankCommentLines.length === 1 ? "" : "s"} ${preview}${remainder}. Fill them in with real notes, or use --remove-empty-comments if you do not want generated placeholders.`,
);
