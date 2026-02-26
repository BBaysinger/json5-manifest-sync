import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";

import { isCliInvocation, runCli, syncJson5 } from "./json5-manifest-sync";

describe("syncJson5", () => {
  it("preserves mapped comments and updates values from source", () => {
    const existingJson5 = `{
  // package version used by releases
  "version": "0.1.0", // tracked by CI
  // dependency list
  "dependencies": [
    // glob helper
    "glob"
  ]
}`;

    const source = {
      version: "0.2.0",
      dependencies: ["glob", "ignore"],
    };

    const output = syncJson5(existingJson5, source, {
      addEmptyCommentIfMissing: false,
    });

    expect(output).toContain("// package version used by releases");
    expect(output).toContain('"version": "0.2.0", // tracked by CI');
    expect(output).toContain("// dependency list");
    expect(output).toContain("// glob helper");
    expect(output).toContain('"ignore",');
  });

  it("adds spacer comments when addEmptyCommentIfMissing is enabled", () => {
    const existingJson5 = `{
  "name": "json5-manifest-sync"
}`;

    const source = {
      name: "json5-manifest-sync",
      type: "module",
    };

    const output = syncJson5(existingJson5, source, {
      addEmptyCommentIfMissing: true,
    });

    expect(output).toContain('\n  //\n  "name": "json5-manifest-sync",');
    expect(output).toContain('\n  //\n  "type": "module",');
  });

  it("adds spacer comments for array items when addEmptyCommentIfMissing is enabled", () => {
    const existingJson5 = `{
  "files": [
    "dist"
  ]
}`;

    const source = {
      files: ["dist", "README.md"],
    };

    const output = syncJson5(existingJson5, source, {
      addEmptyCommentIfMissing: true,
    });

    expect(output).toContain('"files": [');
    expect(output).toContain('\n    //\n    "dist",');
    expect(output).toContain('\n    //\n    "README.md",');
  });
});

describe("isCliInvocation", () => {
  it("returns true for direct node invocation", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json5-sync-cli-"));
    const modulePath = path.join(tempDir, "dist", "json5-manifest-sync.js");
    fs.mkdirSync(path.dirname(modulePath), { recursive: true });
    fs.writeFileSync(modulePath, "");

    const moduleUrl = pathToFileURL(modulePath).href;
    expect(isCliInvocation(modulePath, moduleUrl)).toBe(true);
  });

  it("returns true for symlinked .bin-like invocation path", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json5-sync-bin-"));
    const modulePath = path.join(tempDir, "pkg", "dist", "json5-manifest-sync.js");
    const binPath = path.join(tempDir, "node_modules", ".bin", "json5-manifest-sync");

    fs.mkdirSync(path.dirname(modulePath), { recursive: true });
    fs.mkdirSync(path.dirname(binPath), { recursive: true });
    fs.writeFileSync(modulePath, "");
    fs.symlinkSync(modulePath, binPath);

    const moduleUrl = pathToFileURL(modulePath).href;
    expect(isCliInvocation(binPath, moduleUrl)).toBe(true);
  });
});

describe("runCli", () => {
  it("updates package.json5 values from canonical package.json", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json5-sync-run-"));
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: "consumer-app",
          version: "1.2.3",
          scripts: {
            build: "tsc -p tsconfig.json",
          },
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      packageJson5Path,
      `{
  "name": "consumer-app",
  "version": "0.0.0",
  "scripts": {
    "build": "echo old"
  }
}`,
    );

    const previousCwd = process.cwd();
    try {
      process.chdir(tempDir);
      runCli([]);
    } finally {
      process.chdir(previousCwd);
    }

    const updated = fs.readFileSync(packageJson5Path, "utf8");
    expect(updated).toContain('"version": "1.2.3",');
    expect(updated).toContain('"build": "tsc -p tsconfig.json",');
  });
});
