import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { logger, Logger, LogLevel, createLogger } from "@/index";
import { styled } from "@/styled";

describe("Logger", () => {
  const FIXED_DATE = "2026-01-01T00:00:00.000Z";
  const originalLogLevel = process.env["LOG_LEVEL"];

  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    process.env["FORCE_COLOR"] = "1";
    delete process.env["NO_COLOR"];
    delete process.env["LOG_LEVEL"];
  });

  afterAll(() => {
    delete process.env["FORCE_COLOR"];
    if (originalLogLevel === undefined) {
      delete process.env["LOG_LEVEL"];
    } else {
      process.env["LOG_LEVEL"] = originalLogLevel;
    }
  });

  beforeEach(() => {
    delete process.env["LOG_LEVEL"];
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_DATE));

    // Keep singleton logger behavior stable across tests.
    logger.setLevel(LogLevel.Debug);
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
        const withTimeLogger = new Logger({ showTime: true });
        withTimeLogger.info("test");

        const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;

        expect(logSpy).toHaveBeenCalledWith(
          `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
          "test",
        );
      });

      it("uses plain timestamps when colors are disabled", () => {
        process.env["NO_COLOR"] = "1";
        const withTimeLogger = new Logger({ showTime: true });
        withTimeLogger.info("test");

        expect(logSpy).toHaveBeenCalledWith(`[INFO] ${FIXED_DATE}`, "test");

        delete process.env["NO_COLOR"];
      });

      it("respects showTime setting for all log levels", () => {
        const noTimeLogger = new Logger({ showTime: false });

        noTimeLogger.warn("warning");
        noTimeLogger.error("error");

        const expectedWarnPrefix = `\x1b[33m\x1b[1m[WARN]\x1b[22m\x1b[39m`;
        const expectedErrorPrefix = `\x1b[31m\x1b[1m[ERROR]\x1b[22m\x1b[39m`;

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(expectedWarnPrefix, "warning");

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(expectedErrorPrefix, "error");
      });

      it("supports constructor options object", () => {
        const withOptionsLogger = new Logger({
          showTime: true,
          format: "pretty",
        });
        withOptionsLogger.info("test");

        const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;
        expect(logSpy).toHaveBeenCalledWith(
          `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
          "test",
        );
      });

      it("applies initial logLevel from constructor options", () => {
        const withLevelLogger = new Logger({ logLevel: LogLevel.Warn });

        withLevelLogger.info("hidden");
        withLevelLogger.warn("visible");

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[WARN]"), "visible");
      });

      it("defaults to info when neither LOG_LEVEL nor options.logLevel is set", () => {
        const defaultLevelLogger = new Logger();

        defaultLevelLogger.debug("hidden");
        defaultLevelLogger.info("visible");

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "visible");
      });

      it("prioritizes LOG_LEVEL over options.logLevel", () => {
        process.env["LOG_LEVEL"] = "error";
        const envLogger = new Logger({ logLevel: LogLevel.Debug });

        envLogger.warn("hidden");
        envLogger.error("visible");

        expect(logSpy).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"), "visible");
      });

      it("accepts mixed-case LOG_LEVEL values", () => {
        process.env["LOG_LEVEL"] = "WaRn";
        const envLogger = new Logger();

        envLogger.info("hidden");
        envLogger.warn("visible");

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[WARN]"), "visible");
      });

      it("maps LOG_LEVEL values debug/info/success to the matching internal level", () => {
        const envCases: Array<{ value: string; expected: LogLevel }> = [
          { value: "debug", expected: LogLevel.Debug },
          { value: "info", expected: LogLevel.Info },
          { value: "success", expected: LogLevel.Success },
        ];

        for (const { value, expected } of envCases) {
          process.env["LOG_LEVEL"] = value;
          const envLogger = new Logger();
          expect(envLogger.getLevel()).toBe(expected);
        }
      });

      it("falls back to options.logLevel when LOG_LEVEL is invalid", () => {
        process.env["LOG_LEVEL"] = "verbose";
        const envLogger = new Logger({ logLevel: LogLevel.Success });

        envLogger.info("hidden");
        envLogger.success("visible");

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[SUCCESS]"), "visible");
      });
    });
  });

  describe("factory and child loggers", () => {
    it("creates configured instances via createLogger", () => {
      const customLogger = createLogger({
        showTime: false,
        logLevel: LogLevel.Warn,
      });

      customLogger.info("hidden");
      customLogger.warn("visible");

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[WARN]"), "visible");
    });

    it("applies custom level colors and labels", () => {
      const customLogger = createLogger({
        levelColors: { info: "cyan" },
        levelLabels: { info: "NOTICE" },
      });

      customLogger.info("hello");

      const expectedPrefix = `\x1b[36m\x1b[1m[NOTICE]\x1b[22m\x1b[39m`;
      expect(logSpy).toHaveBeenCalledWith(expectedPrefix, "hello");
    });

    it("rejects invalid level color names at construction time", () => {
      expect(() => createLogger({ levelColors: { error: "nope" as never } })).toThrow(
        'Unknown color for level "error": nope',
      );
    });

    it("inherits parent options and prepends child prefix", () => {
      const parent = createLogger({
        showTime: true,
        logLevel: LogLevel.Info,
      });
      const child = parent.child({ prefix: "[db]" });

      child.debug("hidden");
      child.info("connected");

      const expectedPrefix = `\x1b[34m\x1b[1m[INFO]\x1b[22m\x1b[39m`;
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        `${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`,
        "[db] connected",
      );
    });

    it("inherits custom level colors and labels in child loggers", () => {
      const parent = createLogger({
        levelColors: { warn: "magenta" },
        levelLabels: { warn: "CAUTION" },
      });
      const child = parent.child({ prefix: "[db]" });

      child.warn("slow query");

      const expectedPrefix = `\x1b[35m\x1b[1m[CAUTION]\x1b[22m\x1b[39m`;
      expect(logSpy).toHaveBeenCalledWith(expectedPrefix, "[db] slow query");
    });

    it("combines nested child prefixes", () => {
      const nestedChild = createLogger().child({ prefix: "[api]" }).child({ prefix: "[db]" });

      nestedChild.info("up");

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "[api] [db] up");
    });

    it("inherits onLog hooks in child loggers", () => {
      const hook = vi.fn();
      const child = createLogger({ onLog: hook }).child({ prefix: "[db]" });

      child.info("connected", { attempts: 1 });

      expect(hook).toHaveBeenCalledTimes(1);
      expect(hook).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: '[db] connected {\n  "attempts": 1\n}',
        timestamp: FIXED_DATE,
        raw: ["[db] connected", { attempts: 1 }],
      });
    });

    it("applies child prefix in json mode", () => {
      const child = createLogger({ format: "json" }).child({ prefix: "[worker]" });

      child.info("job started", { id: 1 });

      const line = logSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(line) as {
        message: string;
        args: unknown[];
      };

      expect(parsed.message).toBe('[worker] job started {\n  "id": 1\n}');
      expect(parsed.args).toEqual(["[worker] job started", { id: 1 }]);
    });

    it("logs only the child prefix when a pretty child logger is called without arguments", () => {
      const child = createLogger().child({ prefix: "[worker]" });

      child.info();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "[worker]");
    });

    it("keeps only the child prefix in json mode when called without arguments", () => {
      const child = createLogger({ format: "json" }).child({ prefix: "[worker]" });

      child.info();

      const line = logSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(line) as {
        message: string;
        args: unknown[];
      };

      expect(parsed.message).toBe("[worker]");
      expect(parsed.args).toEqual(["[worker]"]);
    });

    it("prepends the child prefix as a separate json arg when the first value is not a string", () => {
      const child = createLogger({ format: "json" }).child({ prefix: "[worker]" });

      child.info({ id: 1 });

      const line = logSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(line) as {
        message: string;
        args: unknown[];
      };

      expect(parsed.message).toBe('[worker] {\n  "id": 1\n}');
      expect(parsed.args).toEqual(["[worker]", { id: 1 }]);
    });

    it("applies child prefix for log()", () => {
      const child = createLogger().child({ prefix: "[worker]" });

      child.log("manual", { id: 7 });

      expect(logSpy).toHaveBeenCalledWith("[worker] manual", { id: 7 });
    });

    it("logs only the child prefix for log() without arguments", () => {
      const child = createLogger().child({ prefix: "[worker]" });

      child.log();

      expect(logSpy).toHaveBeenCalledWith("[worker]");
    });

    it("prepends the child prefix as a separate value for log() when the first arg is not a string", () => {
      const child = createLogger().child({ prefix: "[worker]" });

      child.log({ id: 7 });

      expect(logSpy).toHaveBeenCalledWith("[worker]", { id: 7 });
    });
  });

  describe("json format", () => {
    it("emits valid NDJSON lines", () => {
      const jsonLogger = new Logger({ format: "json" });

      jsonLogger.info("hello", { foo: "bar" });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const line = logSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(line) as {
        level: string;
        time: string;
        message: string;
        args: unknown[];
      };

      expect(parsed.level).toBe("info");
      expect(parsed.time).toBe(FIXED_DATE);
      expect(parsed.message).toContain("hello");
      expect(parsed.args).toEqual(["hello", { foo: "bar" }]);
    });

    it("includes structured error details", () => {
      const jsonLogger = new Logger({ format: "json" });
      const error = new Error("boom");

      jsonLogger.error(error);

      const line = errorSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(line) as {
        error: { name: string; message: string; stack?: string };
      };

      expect(parsed.error.name).toBe("Error");
      expect(parsed.error.message).toBe("boom");
      expect(parsed.error.stack).toContain("Error: boom");
    });

    it("omits stack in structured json errors when it is missing", () => {
      const jsonLogger = new Logger({ format: "json" });
      const error = new Error("boom");
      delete error.stack;

      jsonLogger.error(error);

      const line = errorSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(line) as {
        error: { name: string; message: string; stack?: string };
      };

      expect(parsed.error).toEqual({
        name: "Error",
        message: "boom",
      });
      expect(parsed.error).not.toHaveProperty("stack");
    });

    it("serializes Map and Set values in json mode", () => {
      const jsonLogger = new Logger({ format: "json" });

      jsonLogger.info(new Map([["key", 1]]), new Set([2, 3]));

      const line = logSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(line) as { args: unknown[] };

      expect(parsed.args).toEqual([{ "[Map]": [["key", 1]] }, { "[Set]": [2, 3] }]);
    });

    it("routes json errors to stderr and non-errors to stdout", () => {
      const jsonLogger = new Logger({ format: "json" });

      jsonLogger.warn("warn");
      jsonLogger.error("error");

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("onLog hooks", () => {
    it("rejects invalid onLog values at construction time", () => {
      expect(() => createLogger({ onLog: "invalid" as unknown as never })).toThrow(
        new TypeError("`onLog` must be a function or an array of functions."),
      );
    });

    it("invokes onLog with a structured log entry", () => {
      const hook = vi.fn();
      const hookLogger = createLogger({ onLog: hook });

      hookLogger.info("job started", { id: 1 });

      expect(hook).toHaveBeenCalledTimes(1);
      expect(hook).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: 'job started {\n  "id": 1\n}',
        timestamp: FIXED_DATE,
        raw: ["job started", { id: 1 }],
      });
    });

    it("supports registering multiple hooks", () => {
      const calls: string[] = [];
      const firstHook = vi.fn(() => {
        calls.push("first");
      });
      const secondHook = vi.fn(() => {
        calls.push("second");
      });
      const hookLogger = createLogger({ onLog: [firstHook, secondHook] });

      hookLogger.warn("careful");

      expect(firstHook).toHaveBeenCalledTimes(1);
      expect(secondHook).toHaveBeenCalledTimes(1);
      expect(calls).toEqual(["first", "second"]);
    });

    it("does not invoke hooks for filtered log levels", () => {
      const hook = vi.fn();
      const hookLogger = createLogger({
        logLevel: LogLevel.Warn,
        onLog: hook,
      });

      hookLogger.info("hidden");

      expect(hook).not.toHaveBeenCalled();
    });

    it("catches hook errors and reports them to stderr without crashing", () => {
      const hookLogger = createLogger({
        onLog: () => {
          throw new Error("hook failed");
        },
      });

      expect(() => hookLogger.info("safe")).not.toThrow();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "safe");
      expect(errorSpy).toHaveBeenCalledWith(
        "[LOGGER_HOOK_ERROR]",
        expect.stringContaining("Error: hook failed"),
      );
    });

    it("reports hook Error instances without a stack using name and message", () => {
      const hookLogger = createLogger({
        onLog: () => {
          const error = new TypeError("hook failed without stack");
          delete error.stack;
          throw error;
        },
      });

      hookLogger.info("safe");

      expect(errorSpy).toHaveBeenCalledWith(
        "[LOGGER_HOOK_ERROR]",
        "TypeError: hook failed without stack",
      );
    });

    it("reports non-Error hook failures using logger formatting", () => {
      const hookLogger = createLogger({
        onLog: () => {
          throw { reason: "hook failed", retryable: false };
        },
      });

      hookLogger.warn("safe");

      expect(errorSpy).toHaveBeenCalledWith(
        "[LOGGER_HOOK_ERROR]",
        '{\n  "reason": "hook failed",\n  "retryable": false\n}',
      );
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

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const expectedWarnPrefix = `\x1b[33m\x1b[1m[WARN]\x1b[22m\x1b[39m`;
      const expectedErrorPrefix = `\x1b[31m\x1b[1m[ERROR]\x1b[22m\x1b[39m`;
      expect(logSpy).toHaveBeenCalledWith(expectedWarnPrefix, `should log`);
      expect(errorSpy).toHaveBeenCalledWith(expectedErrorPrefix, `should log`);
    });

    it("routes levels to the expected streams", () => {
      const customLogger = new Logger({ showTime: false });
      customLogger.setLevel(LogLevel.Debug);

      customLogger.debug("d");
      customLogger.info("i");
      customLogger.success("s");
      customLogger.warn("w");
      customLogger.error("e");

      // debug, info, success, warn → stdout
      expect(logSpy).toHaveBeenCalledTimes(4);
      // only error → stderr
      expect(errorSpy).toHaveBeenCalledTimes(1);
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

      expect(logSpy).toHaveBeenCalledWith(`${expectedPrefix} \x1b[2m${FIXED_DATE}\x1b[22m`, `ok`);
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

      expect(errorSpy).toHaveBeenCalledWith(
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
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("\x1b[31marg1 arg2\x1b[39m"));
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

    it("formats undefined explicitly", () => {
      logger.info(undefined);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "undefined");
    });

    it("formats null explicitly", () => {
      logger.info(null);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "null");
    });

    it("formats Symbol values explicitly", () => {
      logger.info(Symbol("x"));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "Symbol(x)");
    });

    it("formats function values explicitly", () => {
      function namedHandler() {
        return "ok";
      }

      logger.info(namedHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        "[Function: namedHandler]",
      );
    });

    it("formats anonymous function values explicitly", () => {
      logger.info(function () {
        return "ok";
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        "[Function (anonymous)]",
      );
    });

    it("formats Date values explicitly", () => {
      logger.info(new Date(FIXED_DATE));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), FIXED_DATE);
    });

    it("formats invalid Date values explicitly", () => {
      logger.info(new Date(Number.NaN));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "Invalid Date");
    });

    it("formats RegExp values explicitly", () => {
      logger.info(/hello/gi);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "/hello/gi");
    });

    it("formats array values explicitly", () => {
      logger.info([1, { nested: true }]);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        JSON.stringify([1, { nested: true }], null, 2),
      );
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

    it("preserves non-circular shared references", () => {
      const shared = { value: 1 };

      logger.info({ left: shared, right: shared });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"left": {'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"right": {'),
      );
    });

    it("serializes enumerable symbol keys", () => {
      const symbolKey = Symbol("secret");
      const value: Record<PropertyKey, unknown> = {};
      Object.defineProperty(value, symbolKey, {
        enumerable: true,
        value: "visible",
      });

      logger.info(value);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"Symbol(secret)": "visible"'),
      );
    });

    it("omits non-enumerable symbol keys", () => {
      const hiddenKey = Symbol("hidden");
      const value: Record<PropertyKey, unknown> = { visible: true };
      Object.defineProperty(value, hiddenKey, {
        enumerable: false,
        value: "secret",
      });

      logger.info(value);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.not.stringContaining("Symbol(hidden)"),
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

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "99n");
    });

    it("formats Error values and falls back when stack is missing", () => {
      const err = new Error("boom");
      delete err.stack;

      logger.error(err);

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"), "Error: boom");
    });

    it("serializes nested Error objects", () => {
      logger.info({ err: new Error("nested") });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"name": "Error"'),
      );
    });

    it("falls back to inspect() when JSON serialization throws", () => {
      const tricky = {};
      Object.defineProperty(tricky, "broken", {
        enumerable: true,
        get() {
          throw new Error("serialize failed");
        },
      });

      expect(() => logger.info(tricky)).not.toThrow();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining("broken"),
      );
    });

    it("applies the configured serialization depth limit", () => {
      const depthLimitedLogger = new Logger({
        serialization: { depth: 1 },
      });

      depthLimitedLogger.info({ outer: { inner: { value: true } } });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"outer": "[Object]"'),
      );
    });

    it("applies the configured serialization depth limit to arrays", () => {
      const depthLimitedLogger = new Logger({
        serialization: { depth: 1 },
      });

      depthLimitedLogger.info({ items: [{ value: true }] });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining('"items": "[Array]"'),
      );
    });

    it("uses configurable inspect fallback options", () => {
      const compactLogger = new Logger({
        serialization: {
          inspect: {
            depth: 2,
            compact: true,
          },
        },
      });
      const tricky = {};

      Object.defineProperty(tricky, "nested", {
        enumerable: true,
        get() {
          throw new Error("serialize failed");
        },
      });

      compactLogger.info(tricky);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining("{ nested: [Getter] }"),
      );
    });

    it("falls back to inspect for non-plain objects without enumerable keys", () => {
      class HiddenValue {}

      logger.info(new HiddenValue());

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        expect.stringContaining("HiddenValue"),
      );
    });

    it("throws a clear error for invalid rgb style options", () => {
      expect(() => logger.log("bad rgb", { rgb: [1, Number.POSITIVE_INFINITY, 3] as any })).toThrow(
        "`rgb` must be a tuple with 3 finite numbers.",
      );
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
      expect(() => logger.log("bad bg color", { bgColor: "bgNope" as any })).toThrow(
        "Unknown background color: bgNope",
      );
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
      expect(() => logger.log("bad empty modifiers", { modifiers: [] as any })).toThrow(
        "`modifiers` must contain at least one modifier.",
      );
    });

    it("throws a clear error for invalid modifier names", () => {
      expect(() => logger.log("bad mod", { modifiers: ["bold", "nope"] as any })).toThrow(
        "Unknown modifier: nope",
      );
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

        expect(logSpy).toHaveBeenCalledWith("\x1b[38;2;16;32;48mhex option\x1b[39m");
      });

      it("supports log() with bgRgb style options", () => {
        logger.log("bg rgb option", { bgRgb: [4, 5, 6] });

        expect(logSpy).toHaveBeenCalledWith("\x1b[48;2;4;5;6mbg rgb option\x1b[49m");
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

        expect(logSpy).toHaveBeenCalledWith("\x1b[38;2;50;50;50mrgb colored text\x1b[39m");
      });

      it("supports rgb background styling that logs automatically", () => {
        logger.bgRgb(50, 50, 50)("rgb colored background");

        expect(logSpy).toHaveBeenCalledWith("\x1b[48;2;50;50;50mrgb colored background\x1b[49m");
      });

      it("supports hex text styling that logs automatically", () => {
        logger.hex("#336699")("hex colored text");

        expect(logSpy).toHaveBeenCalledWith("\x1b[38;2;51;102;153mhex colored text\x1b[39m");
      });

      it("supports hex background styling that logs automatically", () => {
        logger.bgHex("#102030")("hex colored background");

        expect(logSpy).toHaveBeenCalledWith("\x1b[48;2;16;32;48mhex colored background\x1b[49m");
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
