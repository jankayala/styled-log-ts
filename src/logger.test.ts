import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import { logger, Logger, LogLevel } from "@/index";
import { styled } from "@/styled";

describe("Logger", () => {
  const FIXED_DATE = "2026-01-01T00:00:00.000Z";

  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    process.env["FORCE_COLOR"] = "1";
    delete process.env["NO_COLOR"];
  });

  afterAll(() => {
    delete process.env["FORCE_COLOR"];
  });

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_DATE));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("constructor", () => {
    describe("showTime parameter", () => {
      it("creates logger without timestamps by default", () => {
        const noTimeLogger = new Logger();
        noTimeLogger.info("test");

        const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;

        expect(logSpy).toHaveBeenCalledWith(expectedPrefix, "test");
      });

      it("creates logger with timestamps when showTime=true", () => {
        const withTimeLogger = new Logger(true);
        withTimeLogger.info("test");

        const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;

        expect(logSpy).toHaveBeenCalledWith(
          `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
          "test",
        );
      });

      it("uses plain timestamps when colors are disabled", () => {
        process.env["NO_COLOR"] = "1";
        const withTimeLogger = new Logger(true);
        withTimeLogger.info("test");

        expect(logSpy).toHaveBeenCalledWith(`[INFO] ${FIXED_DATE}`, "test");

        delete process.env["NO_COLOR"];
      });

      it("respects showTime setting for all log levels", () => {
        const noTimeLogger = new Logger(false);

        noTimeLogger.warn("warning");
        noTimeLogger.error("error");

        expect(logSpy).toHaveBeenCalledTimes(2);

        const expectedWarnPrefix = `\x1b[33m\x1b[1m[WARN]\x1b[22m\x1b[39m`;
        const expectedErrorPrefix = `\x1b[31m\x1b[1m[ERROR]\x1b[22m\x1b[39m`;

        expect(logSpy).toHaveBeenNthCalledWith(
          1,
          expectedWarnPrefix,
          "warning",
        );
        expect(logSpy).toHaveBeenNthCalledWith(2, expectedErrorPrefix, "error");
      });
    });
  });

  describe("log levels", () => {
    it("respects log level settings", () => {
      const customLogger = new Logger();
      customLogger.setLevel(LogLevel.Warn);

      customLogger.debug("should not log");
      customLogger.info("should not log");
      customLogger.success("should not log");
      customLogger.warn("should log");
      customLogger.error("should log");

      expect(logSpy).toHaveBeenCalledTimes(2);
      const expectedWarnPrefix = `\x1b[33m\x1b[1m[WARN]\x1b[22m\x1b[39m`;
      const expectedErrorPrefix = `\x1b[31m\x1b[1m[ERROR]\x1b[22m\x1b[39m`;
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        expectedWarnPrefix,
        `should log`,
      );
      expect(logSpy).toHaveBeenNthCalledWith(
        2,
        expectedErrorPrefix,
        `should log`,
      );
    });
  });

  describe("logging methods", () => {
    it("logs debug with correct color", () => {
      logger.debug("debug");

      const expectedPrefix = `\x1b[35m\x1b[1m[DEBUG]\x1b[22m\x1b[39m`;

      expect(logSpy).toHaveBeenCalledWith(
        `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
        `debug`,
      );
    });

    it("logs info with correct format and color", () => {
      logger.info("hello");

      const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;

      expect(logSpy).toHaveBeenCalledWith(
        `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
        `hello`,
      );
    });

    it("logs success with correct color", () => {
      logger.success("ok");

      const expectedPrefix = `\x1b[32m\x1b[1m[SUCCESS]\x1b[22m\x1b[39m`;

      expect(logSpy).toHaveBeenCalledWith(
        `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
        `ok`,
      );
    });

    it("logs warn with correct color", () => {
      logger.warn("warn msg");

      const expectedPrefix = `\x1b[33m\x1b[1m[WARN]\x1b[22m\x1b[39m`;

      expect(logSpy).toHaveBeenCalledWith(
        `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
        `warn msg`,
      );
    });

    it("logs error with correct color", () => {
      logger.error("fail");

      const expectedPrefix = `\x1b[31m\x1b[1m[ERROR]\x1b[22m\x1b[39m`;

      expect(logSpy).toHaveBeenCalledWith(
        `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
        `fail`,
      );
    });

    it("formats objects as JSON", () => {
      logger.info({ foo: "bar" });

      const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;

      expect(logSpy).toHaveBeenCalledWith(
        `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
        `${JSON.stringify({ foo: "bar" }, null, 2)}`,
      );
    });

    it("supports multiple Logger instances", () => {
      const customLogger = new Logger();
      customLogger.info("multi");

      const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;

      expect(logSpy).toHaveBeenCalledWith(`${expectedPrefix}`, `multi`);
    });
  });

  describe("log() method", () => {
    it("supports log() method like console.log", () => {
      logger.log("test log");
      expect(logSpy).toHaveBeenCalledWith("test log");
    });

    it("supports log() with multiple arguments", () => {
      logger.log("arg1", 2, { three: 3 });
      expect(logSpy).toHaveBeenCalledWith("arg1", 2, { three: 3 });
    });

    it("log() with multiple args and options", () => {
      logger.log("arg1", "arg2", { color: "red" });
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("\x1b[31marg1 arg2\x1b[39m"),
      );
    });

    it("handles null or non-object options in log()", () => {
      logger.log("msg", null);
      logger.log("msg", "not-an-object");
      expect(logSpy).toHaveBeenCalledTimes(2);
    });

    it("handles empty options object in log()", () => {
      logger.log("msg", {});
      expect(logSpy).toHaveBeenCalledWith("msg", {});
    });

    it("formats circular objects without throwing", () => {
      const circular: Record<string, unknown> = { name: "root" };
      circular.self = circular;

      expect(() => logger.info(circular)).not.toThrow();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining("[Circular]"),
      );
    });

    it("formats BigInt values in objects", () => {
      logger.info({ value: 10n });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"10n"'),
      );
    });

    it("formats primitive BigInt values", () => {
      logger.info(99n);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        "99n",
      );
    });

    it("formats Error values and falls back when stack is missing", () => {
      const err = new Error("boom");
      delete err.stack;

      logger.error(err);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
        "Error: boom",
      );
    });

    it("serializes nested Error objects", () => {
      logger.info({ err: new Error("nested") });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"name": "Error"'),
      );
    });

    it("falls back to inspect() when JSON serialization throws", () => {
      const tricky = {
        toJSON() {
          throw new Error("serialize failed");
        },
      };

      expect(() => logger.info(tricky)).not.toThrow();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining("toJSON"),
      );
    });

    it("throws a clear error for invalid rgb style options", () => {
      expect(() =>
        logger.log("bad rgb", { rgb: [1, Number.POSITIVE_INFINITY, 3] as any }),
      ).toThrow("`rgb` must be a tuple with 3 finite numbers.");
    });

    it("throws a clear error for invalid bgRgb style options", () => {
      expect(() =>
        logger.log("bad bg rgb", {
          bgRgb: [1, Number.POSITIVE_INFINITY, 3] as any,
        }),
      ).toThrow("`bgRgb` must be a tuple with 3 finite numbers.");
    });

    it("throws a clear error for unknown color names", () => {
      expect(() => logger.log("bad color", { color: "nope" as any })).toThrow(
        "Unknown color: nope",
      );
    });

    it("throws a clear error for unknown background color names", () => {
      expect(() =>
        logger.log("bad bg color", { bgColor: "bgNope" as any }),
      ).toThrow("Unknown background color: bgNope");
    });

    it("throws a clear error for invalid hex style options", () => {
      expect(() => logger.log("bad hex", { hex: "#xyz" as any })).toThrow(
        "`hex` must be a valid 3 or 6 digit hex value.",
      );
    });

    it("throws a clear error for invalid bgHex style options", () => {
      expect(() => logger.log("bad bg hex", { bgHex: "#xyz" as any })).toThrow(
        "`bgHex` must be a valid 3 or 6 digit hex value.",
      );
    });

    it("throws a clear error for empty modifiers arrays", () => {
      expect(() =>
        logger.log("bad empty modifiers", { modifiers: [] as any }),
      ).toThrow("`modifiers` must contain at least one modifier.");
    });

    it("throws a clear error for invalid modifier names", () => {
      expect(() =>
        logger.log("bad mod", { modifiers: ["bold", "nope"] as any }),
      ).toThrow("Unknown modifier: nope");
    });
  });

  describe("styling", () => {
    describe("StyleOptions", () => {
      it("log() applies custom styles using StyleOptions", () => {
        logger.log("styled", {
          color: "cyan",
          modifiers: ["bold", "underline"],
        });

        expect(logSpy).toHaveBeenCalled();
        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("styled");
        expect(calledWith).toContain("\x1b[36m"); // cyan
        expect(calledWith).toContain("\x1b[1m"); // bold
        expect(calledWith).toContain("\x1b[4m"); // underline
      });

      it("log() applies single modifier", () => {
        logger.log("single mod", {
          modifiers: "bold",
        });

        expect(logSpy).toHaveBeenCalled();
        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("single mod");
        expect(calledWith).toContain("\x1b[1m");
      });

      it("log() applies background color", () => {
        logger.log("bg test", {
          bgColor: "bgRed",
        });

        expect(logSpy).toHaveBeenCalled();
        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("bg test");
        expect(calledWith).toContain("\x1b[41m"); // bgRed
      });

      it("supports log() with hex style options", () => {
        logger.log("hex option", { hex: "#102030" });

        expect(logSpy).toHaveBeenCalledWith(
          "\x1b[38;2;16;32;48mhex option\x1b[39m",
        );
      });

      it("supports log() with bgRgb style options", () => {
        logger.log("bg rgb option", { bgRgb: [4, 5, 6] });

        expect(logSpy).toHaveBeenCalledWith(
          "\x1b[48;2;4;5;6mbg rgb option\x1b[49m",
        );
      });

      it("supports log() with rgb and bgHex style options", () => {
        logger.log("rich styles", {
          rgb: [1, 2, 3],
          bgHex: "#070809",
        });

        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("rich styles");
        expect(calledWith).toContain("\x1b[38;2;1;2;3m");
        expect(calledWith).toContain("\x1b[48;2;7;8;9m");
      });
    });

    describe("chaining", () => {
      it("supports styled chaining that logs automatically", () => {
        logger.red.bgBlack("styled text");

        expect(logSpy).toHaveBeenCalled();
        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("styled text");
        expect(calledWith).toContain("\x1b[31m"); // red
        expect(calledWith).toContain("\x1b[40m"); // bgBlack
      });

      it("supports chained rgb and bgHex after existing styles", () => {
        logger.bold.rgb(1, 2, 3).bgHex("#040506")("chained styled text");

        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("chained styled text");
        expect(calledWith).toContain("\x1b[1m");
        expect(calledWith).toContain("\x1b[38;2;1;2;3m");
        expect(calledWith).toContain("\x1b[48;2;4;5;6m");
      });

      it("supports chained bgRgb after existing styles", () => {
        logger.bold.bgRgb(7, 8, 9)("bgRgb chained text");

        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("bgRgb chained text");
        expect(calledWith).toContain("\x1b[1m");
        expect(calledWith).toContain("\x1b[48;2;7;8;9m");
      });

      it("supports chained hex after existing styles", () => {
        logger.underline.hex("#112233")("hex chained text");

        const calledWith = logSpy.mock.calls[0][0];
        expect(calledWith).toContain("hex chained text");
        expect(calledWith).toContain("\x1b[4m");
        expect(calledWith).toContain("\x1b[38;2;17;34;51m");
      });
    });

    describe("rgb and hex", () => {
      it("supports rgb text styling that logs automatically", () => {
        logger.rgb(50, 50, 50)("rgb colored text");

        expect(logSpy).toHaveBeenCalledWith(
          "\x1b[38;2;50;50;50mrgb colored text\x1b[39m",
        );
      });

      it("supports rgb background styling that logs automatically", () => {
        logger.bgRgb(50, 50, 50)("rgb colored background");

        expect(logSpy).toHaveBeenCalledWith(
          "\x1b[48;2;50;50;50mrgb colored background\x1b[49m",
        );
      });

      it("supports hex text styling that logs automatically", () => {
        logger.hex("#336699")("hex colored text");

        expect(logSpy).toHaveBeenCalledWith(
          "\x1b[38;2;51;102;153mhex colored text\x1b[39m",
        );
      });

      it("supports hex background styling that logs automatically", () => {
        logger.bgHex("#102030")("hex colored background");

        expect(logSpy).toHaveBeenCalledWith(
          "\x1b[48;2;16;32;48mhex colored background\x1b[49m",
        );
      });
    });
  });

  describe("proxy behavior", () => {
    it("accesses non-function properties on logger proxy", () => {
      expect(logger.setLevel).toBeDefined();
      expect(logger.getLevel()).toBe(LogLevel.Debug);
      expect((logger as any).currentLevel).toBe(LogLevel.Debug);
    });

    it("handles unknown prop in chained logger proxy by returning undefined (line 119 and line 133)", () => {
      const chained = logger.red;
      expect((chained as any)._nonExistent).toBeUndefined();
      expect((chained as any)[Symbol("test")]).toBeUndefined();

      expect((logger as any)._anotherNonExistent).toBeUndefined();
      expect((logger as any)[Symbol("test")]).toBeUndefined();
    });
  });
});

describe("styled proxy", () => {
  beforeAll(() => {
    process.env["FORCE_COLOR"] = "1";
    delete process.env["NO_COLOR"];
  });

  afterAll(() => {
    delete process.env["FORCE_COLOR"];
  });

  describe("error handling", () => {
    it("throws error for unknown styles", () => {
      expect(() => (styled as any).unknown).toThrow("Unknown style: unknown");
    });

    it("handles Symbol props in styled proxy (branch coverage)", () => {
      expect(() => (styled as any)[Symbol("test")]).toThrow();
    });
  });
});
