import { describe, it, expect } from "vitest";
import loggerDefault, * as index from "@/index";

describe("index re-exports", () => {
  it("exports logger", () => {
    expect(index.logger).toBeDefined();
  });

  it("exports logger as default", () => {
    expect(loggerDefault).toBe(index.logger);
  });

  it("exports styles", () => {
    expect(index.styled).toBeDefined();
  });
});
