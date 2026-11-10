import { describe, expect, it, vi } from "vitest";
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
      blankCommentMode: "preserve",
    });

    expect(output).toContain("// package version used by releases");
    expect(output).toContain('"version": "0.2.0", // tracked by CI');
    expect(output).toContain("// dependency list");
    expect(output).toContain("// glob helper");
    expect(output).toContain('"ignore",');
  });

  it("fills omitted object comments when blankCommentMode is fill", () => {
    const existingJson5 = `{
  "name": "json5-manifest-sync"
}`;

    const source = {
      name: "json5-manifest-sync",
      type: "module",
    };

    const output = syncJson5(existingJson5, source, {
      blankCommentMode: "fill",
    });

    expect(output).toContain('\n  //\n  "name": "json5-manifest-sync",');
    expect(output).toContain('\n  //\n  "type": "module",');
  });

  it("fills omitted array item comments when blankCommentMode is fill", () => {
    const existingJson5 = `{
  "files": [
    "dist"
  ]
}`;

    const source = {
      files: ["dist", "README.md"],
    };

    const output = syncJson5(existingJson5, source, {
      blankCommentMode: "fill",
    });

    expect(output).toContain('"files": [');
    expect(output).toContain('\n    //\n    "dist",');
    expect(output).toContain('\n    //\n    "README.md",');
  });

  it("preserves existing blank comments without filling omitted ones in preserve mode", () => {
    const existingJson5 = `{
  //
  "name": "json5-manifest-sync"
}`;

    const source = {
      name: "json5-manifest-sync",
      type: "module",
    };

    const output = syncJson5(existingJson5, source, {
      blankCommentMode: "preserve",
    });

    expect(output).toContain('\n  //\n  "name": "json5-manifest-sync",');
    expect(output).not.toContain('\n  //\n  "type": "module",');
    expect(output).toContain('\n  "type": "module",');
  });

  it("removes blank comments entirely in remove mode", () => {
    const existingJson5 = `{
  //
  "name": "json5-manifest-sync",
  "files": [
    //
    "dist"
  ]
}`;

    const source = {
      name: "json5-manifest-sync",
      files: ["dist", "README.md"],
    };

    const output = syncJson5(existingJson5, source, {
      blankCommentMode: "remove",
    });

    expect(output).not.toContain("\n  //\n");
    expect(output).not.toContain("\n    //\n");
    expect(output).toContain('"README.md",');
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
    const modulePath = path.join(
      tempDir,
      "pkg",
      "dist",
      "json5-manifest-sync.js",
    );
    const binPath = path.join(
      tempDir,
      "node_modules",
      ".bin",
      "json5-manifest-sync",
    );

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

  it("does not rewrite package.json5 when synchronization produces no changes", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json5-sync-noop-"));
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    const source = { name: "consumer-app" };

    fs.writeFileSync(packageJsonPath, JSON.stringify(source, null, 2));
    fs.writeFileSync(packageJson5Path, syncJson5("{}", source));

    const previousCwd = process.cwd();
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    try {
      process.chdir(tempDir);
      runCli(["--source=package.json"]);
    } finally {
      process.chdir(previousCwd);
      writeSpy.mockRestore();
    }

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("reports out-of-sync manifests without writing in check mode", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json5-sync-check-"));
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    const staleManifest = `{ "name": "old-name" }`;

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ name: "consumer-app" }, null, 2),
    );
    fs.writeFileSync(packageJson5Path, staleManifest);

    const previousCwd = process.cwd();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    let status = 0;
    let output = "";
    try {
      process.chdir(tempDir);
      status = runCli(["--check"]);
      output = infoSpy.mock.calls.flat().join(" ");
    } finally {
      process.chdir(previousCwd);
      infoSpy.mockRestore();
      writeSpy.mockRestore();
    }

    expect(status).toBe(1);
    expect(fs.readFileSync(packageJson5Path, "utf8")).toBe(staleManifest);
    expect(writeSpy).not.toHaveBeenCalled();
    expect(output).toContain("❌ Out of sync");
  });

  it("returns success in check mode when manifests are synchronized", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-check-ok-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    const source = { name: "consumer-app" };

    fs.writeFileSync(packageJsonPath, JSON.stringify(source, null, 2));
    fs.writeFileSync(packageJson5Path, syncJson5("{}", source));

    const previousCwd = process.cwd();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    let status = 0;
    let output = "";
    try {
      process.chdir(tempDir);
      status = runCli(["--check"]);
      output = infoSpy.mock.calls.flat().join(" ");
    } finally {
      process.chdir(previousCwd);
      infoSpy.mockRestore();
      writeSpy.mockRestore();
    }

    expect(status).toBe(0);
    expect(writeSpy).not.toHaveBeenCalled();
    expect(output).toContain("✅ In sync");
  });

  it("reports a missing package.json as out of sync when JSON5 is the source", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-check-missing-json-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    fs.writeFileSync(packageJson5Path, "{ name: 'consumer-app' }");

    const previousCwd = process.cwd();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    let output = "";
    try {
      process.chdir(tempDir);
      expect(runCli(["--source=package.json5", "--check"])).toBe(1);
      output = infoSpy.mock.calls.flat().join(" ");
    } finally {
      process.chdir(previousCwd);
      infoSpy.mockRestore();
    }

    expect(fs.existsSync(packageJsonPath)).toBe(false);
    expect(output).toContain("❌ Out of sync");
  });

  it("updates package.json from package.json5 when selected as the source", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-source-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    const documentedManifest = `{
  // Keep this explanation in the documented source.
  "name": "consumer-app",
  "version": '2.0.0',
  "scripts": {
    "build": "tsc -p tsconfig.json",
  },
}`;

    fs.writeFileSync(packageJsonPath, JSON.stringify({ name: "old-name" }));
    fs.writeFileSync(packageJson5Path, documentedManifest);

    const previousCwd = process.cwd();
    try {
      process.chdir(tempDir);
      runCli(["--source=package.json5"]);
    } finally {
      process.chdir(previousCwd);
    }

    const updated = fs.readFileSync(packageJsonPath, "utf8");
    expect(JSON.parse(updated)).toEqual({
      name: "consumer-app",
      version: "2.0.0",
      scripts: { build: "tsc -p tsconfig.json" },
    });
    expect(updated).not.toContain("//");
    expect(fs.readFileSync(packageJson5Path, "utf8")).toBe(documentedManifest);
  });

  it("creates package.json from package.json5 when the JSON file is missing", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-create-json-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");

    fs.writeFileSync(
      packageJson5Path,
      `{
  // Manifest for tools that require strict JSON.
  name: 'consumer-app',
  version: '2.0.0',
  scripts: {
    build: 'tsc -p tsconfig.json',
  },
}`,
    );

    const previousCwd = process.cwd();
    try {
      process.chdir(tempDir);
      runCli(["--source=package.json5"]);
    } finally {
      process.chdir(previousCwd);
    }

    expect(fs.existsSync(packageJsonPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))).toEqual({
      name: "consumer-app",
      version: "2.0.0",
      scripts: { build: "tsc -p tsconfig.json" },
    });
  });

  it("loads the manifest source from the project .env file", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-env-source-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    const previousCwd = process.cwd();
    const previousSource = process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;

    fs.writeFileSync(
      path.join(tempDir, ".env"),
      "JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH=package.json5\n",
    );
    fs.writeFileSync(
      packageJson5Path,
      "{ name: 'consumer-app', version: '2.0.0' }",
    );

    try {
      delete process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;
      process.chdir(tempDir);
      runCli([]);
    } finally {
      process.chdir(previousCwd);
      if (previousSource === undefined) {
        delete process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;
      } else {
        process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH = previousSource;
      }
    }

    expect(JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))).toEqual({
      name: "consumer-app",
      version: "2.0.0",
    });
  });

  it("lets the CLI source option override a valid .env setting", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-env-override-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    const previousCwd = process.cwd();
    const previousSource = process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;

    fs.writeFileSync(
      path.join(tempDir, ".env"),
      "JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH=package.json5\n",
    );
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ name: "canonical-name", version: "1.0.0" }),
    );
    fs.writeFileSync(
      packageJson5Path,
      "{ name: 'stale-name', version: '0.0.0' }",
    );

    try {
      delete process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;
      process.chdir(tempDir);
      runCli(["--source=package.json"]);
    } finally {
      process.chdir(previousCwd);
      if (previousSource === undefined) {
        delete process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;
      } else {
        process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH = previousSource;
      }
    }

    expect(fs.readFileSync(packageJson5Path, "utf8")).toContain(
      '"name": "canonical-name",',
    );
  });

  it("throws for an invalid .env source even when the CLI overrides it", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-invalid-env-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");
    const previousCwd = process.cwd();
    const previousSource = process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;

    fs.writeFileSync(
      path.join(tempDir, ".env"),
      "JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH=invalid\n",
    );
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ name: "canonical-name", version: "1.0.0" }),
    );
    fs.writeFileSync(
      packageJson5Path,
      "{ name: 'stale-name', version: '0.0.0' }",
    );

    try {
      delete process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;
      process.chdir(tempDir);
      expect(() => runCli(["--source=package.json"])).toThrowError(
        'Invalid JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH in .env: "invalid". Expected "package.json" or "package.json5".',
      );
      expect(fs.readFileSync(packageJson5Path, "utf8")).toBe(
        "{ name: 'stale-name', version: '0.0.0' }",
      );
    } finally {
      process.chdir(previousCwd);
      if (previousSource === undefined) {
        delete process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH;
      } else {
        process.env.JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH = previousSource;
      }
    }
  });

  it("rejects an invalid manifest source without changing files", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    runCli(["--source=package.yaml"]);

    expect(errorSpy).toHaveBeenCalledWith(
      'Invalid source "package.yaml". Use --source=package.json or --source=package.json5.',
    );
    errorSpy.mockRestore();
  });

  it("removes blank comments with blank-comments=remove", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json5-sync-flags-"));
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: "consumer-app",
          type: "module",
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      packageJson5Path,
      `{
  "name": "consumer-app"
}`,
    );

    const previousCwd = process.cwd();
    try {
      process.chdir(tempDir);
      runCli(["--blank-comments=remove"]);
    } finally {
      process.chdir(previousCwd);
    }

    const updated = fs.readFileSync(packageJson5Path, "utf8");
    expect(updated).not.toContain("\n  //\n");
    expect(updated).toContain('"name": "consumer-app",');
    expect(updated).toContain('"type": "module",');
  });

  it("warns about blank comments after sync when requested", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json5-sync-warn-"));
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: "consumer-app",
          type: "module",
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      packageJson5Path,
      `{
  "name": "consumer-app"
}`,
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const previousCwd = process.cwd();
    try {
      process.chdir(tempDir);
      runCli(["--blank-comments=fill", "--warn-blank-comments"]);
    } finally {
      process.chdir(previousCwd);
    }

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("[warn:blank-comments]");
    expect(warnSpy.mock.calls[0]?.[0]).toContain(
      "package.json5 contains 2 blank comment placeholders",
    );
    warnSpy.mockRestore();
  });

  it("warns about preserved blank comments in preserve mode", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "json5-sync-preserve-"),
    );
    const packageJsonPath = path.join(tempDir, "package.json");
    const packageJson5Path = path.join(tempDir, "package.json5");

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: "consumer-app",
          type: "module",
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      packageJson5Path,
      `{
  //
  "name": "consumer-app"
}`,
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const previousCwd = process.cwd();
    try {
      process.chdir(tempDir);
      runCli(["--blank-comments=preserve", "--warn-blank-comments"]);
    } finally {
      process.chdir(previousCwd);
    }

    const updated = fs.readFileSync(packageJson5Path, "utf8");
    expect(updated).toContain('\n  //\n  "name": "consumer-app",');
    expect(updated).not.toContain('\n  //\n  "type": "module",');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
