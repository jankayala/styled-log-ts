import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  styled,
  type ColorName,
  type BgColorName,
  type ModifierName,
  COLOR_CODES,
  BG_COLOR_CODES,
  MODIFIER_CODES,
} from "@/styled";

describe("styled", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("color application", () => {
    it("should apply single color with dot notation", () => {
      const result = styled.red("Hello");
      expect(result).toBe("\x1b[31mHello\x1b[39m");
    });

    it("should apply single color with bracket notation", () => {
      const result = styled["red"]("Hello");
      expect(result).toBe("\x1b[31mHello\x1b[39m");
    });

    const colorCases = Object.entries(COLOR_CODES).map(
      ([color, [open, close]]) =>
        [color, open, close] as [ColorName, number, number],
    );

    it.each(colorCases)(
      "should apply for color %s the codes %i and %i",
      (color: ColorName, codeOpen: number, codeClose: number) => {
        const result = styled[color]("Text");
        expect(result).toBe(`\x1b[${codeOpen}mText\x1b[${codeClose}m`);
      },
    );

    it("should warn when multiple foreground colors are applied", () => {
      styled.red.blue("Hello");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe("bgColor application", () => {
    it("should apply single color with dot notation", () => {
      const result = styled.bgRed("Hello");
      expect(result).toBe("\x1b[41mHello\x1b[49m");
    });

    it("should apply single color with bracket notation", () => {
      const result = styled["bgRed"]("Hello");
      expect(result).toBe("\x1b[41mHello\x1b[49m");
    });

    const bgColorCases = Object.entries(BG_COLOR_CODES).map(
      ([bgColor, [open, close]]) =>
        [bgColor, open, close] as [BgColorName, number, number],
    );

    it.each(bgColorCases)(
      "should apply for bgColor %s the codes %i and %i",
      (bgColor: BgColorName, codeOpen: number, codeClose: number) => {
        const result = styled[bgColor]("Text");
        expect(result).toBe(`\x1b[${codeOpen}mText\x1b[${codeClose}m`);
      },
    );

    it("should warn when multiple background colors are applied", () => {
      styled.bgRed.bgBlue("Hello");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe("modifier application", () => {
    it("should apply single modifier with dot notation", () => {
      const result = styled.bold("Hello");
      expect(result).toBe("\x1b[1mHello\x1b[22m");
    });

    const modifierCases = Object.entries(MODIFIER_CODES).map(
      ([modifier, [open, close]]) =>
        [modifier, open, close] as [ModifierName, number, number],
    );

    it.each(modifierCases)(
      "should apply for modifier %s the codes %i and %i",
      (modifier: ModifierName, codeOpen: number, codeClose: number) => {
        const result = styled[modifier]("Text");
        expect(result).toBe(`\x1b[${codeOpen}mText\x1b[${codeClose}m`);
      },
    );

    it("should NOT warn when multiple modifiers are applied", () => {
      styled.bold.underline("Hello");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
