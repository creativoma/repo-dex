import { describe, expect, it } from "vitest";
import { detectUrlType } from "./detect-url-type";

describe("detectUrlType", () => {
  describe("github URLs", () => {
    it("returns 'github' for github.com", () => {
      expect(detectUrlType("https://github.com/owner/repo")).toBe("github");
    });

    it("returns 'github' for www.github.com", () => {
      expect(detectUrlType("https://www.github.com/owner/repo")).toBe("github");
    });

    it("is case-insensitive for the host", () => {
      expect(detectUrlType("https://GitHub.COM/owner/repo")).toBe("github");
    });
  });

  describe("npm URLs", () => {
    it("returns 'npm' for npmjs.com", () => {
      expect(detectUrlType("https://npmjs.com/package/lodash")).toBe("npm");
    });

    it("returns 'npm' for www.npmjs.com", () => {
      expect(detectUrlType("https://www.npmjs.com/package/lodash")).toBe("npm");
    });

    it("returns 'npm' for npm.im", () => {
      expect(detectUrlType("https://npm.im/lodash")).toBe("npm");
    });

    it("returns 'npm' for unpkg.com", () => {
      expect(detectUrlType("https://unpkg.com/lodash")).toBe("npm");
    });
  });

  describe("web URLs", () => {
    it("returns 'web' for unrecognised hosts", () => {
      expect(detectUrlType("https://example.com")).toBe("web");
    });

    it("returns 'web' for subdomains of known sites that are not exact matches", () => {
      expect(detectUrlType("https://docs.github.com")).toBe("web");
    });
  });

  describe("invalid input", () => {
    it("returns 'web' for a non-URL string", () => {
      expect(detectUrlType("not-a-url")).toBe("web");
    });

    it("returns 'web' for an empty string", () => {
      expect(detectUrlType("")).toBe("web");
    });
  });
});
