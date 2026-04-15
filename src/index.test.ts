import { describe, it, expect } from "vitest";
import * as index from "@/index";

describe("index re-exports", () => {
  it("exports createLogger", () => {
    expect(index.createLogger).toBeDefined();
  });

  it("exports logger", () => {
    expect(index.logger).toBeDefined();
  });

  it("does not expose a default export", () => {
    expect(index).not.toHaveProperty("default");
  });

  it("exports styles", () => {
    expect(index.styled).toBeDefined();
  });
});
