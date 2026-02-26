import { describe, expect, it } from "vitest";

import { syncJson5 } from "./json5-manifest-sync";

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
});
