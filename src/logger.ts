import {
  styled,
  type ColorName,
  type StyleName,
  ANSI_CODES,
  COLOR_CODES,
  BG_COLOR_CODES,
  MODIFIER_CODES,
  type StyleOptions,
} from "@/styled";
import { shouldUseColor } from "@/color-support";
import { inspect } from "node:util";

export enum LogLevel {
  Debug = "debug",
  Info = "info",
  Success = "success",
  Warn = "warn",
  Error = "error",
}

export type LogFormat = "pretty" | "json";

export type LoggerInspectOptions = {
  depth?: number;
  compact?: boolean | number;
};

export type LoggerSerializationOptions = {
  depth?: number;
  inspect?: LoggerInspectOptions;
};

export type LoggerLevelColors = Partial<Record<LogLevel, ColorName>>;

export type LoggerLevelLabels = Partial<Record<LogLevel, string>>;

export type LoggerOptions = {
  showTime?: boolean;
  format?: LogFormat;
  logLevel?: LogLevel;
  serialization?: LoggerSerializationOptions;
  prefix?: string;
  levelColors?: LoggerLevelColors;
  levelLabels?: LoggerLevelLabels;
};

export type LoggerChildOptions = {
  prefix?: string;
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
};

type ResolvedLoggerInspectOptions = {
  depth: number;
  compact: boolean | number;
};

type ResolvedLoggerSerializationOptions = {
  depth: number;
  inspect: ResolvedLoggerInspectOptions;
};

const DEFAULT_SERIALIZATION_OPTIONS: ResolvedLoggerSerializationOptions = {
  depth: 4,
  inspect: {
    depth: 4,
    compact: false,
  },
};

const DEFAULT_LEVEL_COLORS: Record<LogLevel, ColorName> = {
  debug: "magenta",
  info: "blue",
  success: "green",
  warn: "yellow",
  error: "red",
};

const DEFAULT_LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  success: "SUCCESS",
  warn: "WARN",
  error: "ERROR",
};

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function resolveSerializationOptions(
  options?: LoggerSerializationOptions,
): ResolvedLoggerSerializationOptions {
  return {
    depth: normalizeNonNegativeInteger(options?.depth, DEFAULT_SERIALIZATION_OPTIONS.depth),
    inspect: {
      depth: normalizeNonNegativeInteger(
        options?.inspect?.depth,
        DEFAULT_SERIALIZATION_OPTIONS.inspect.depth,
      ),
      compact: options?.inspect?.compact ?? DEFAULT_SERIALIZATION_OPTIONS.inspect.compact,
    },
  };
}

function inspectFallback(value: unknown, options: ResolvedLoggerSerializationOptions): string {
  return inspect(value, {
    depth: options.inspect.depth,
    colors: false,
    compact: options.inspect.compact,
  });
}

function formatFunction(fn: Function): string {
  return fn.name ? `[Function: ${fn.name}]` : "[Function (anonymous)]";
}

function serializeError(error: Error): {
  name: string;
  message: string;
  stack?: string;
} {
  const serialized = {
    name: error.name,
    message: error.message,
  };

  if (error.stack !== undefined) {
    return {
      ...serialized,
      stack: error.stack,
    };
  }

  return serialized;
}

function toSerializable(
  value: unknown,
  options: ResolvedLoggerSerializationOptions,
  depth: number = 0,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
  }

  if (value instanceof RegExp) {
    return String(value);
  }

  if (typeof value === "bigint") {
    return `${value}n`;
  }

  if (typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "function") {
    return formatFunction(value);
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (depth >= options.depth) {
    return Array.isArray(value) ? "[Array]" : "[Object]";
  }

  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return value.map((item) => toSerializable(item, options, depth + 1, seen));
    }

    if (value instanceof Map) {
      return {
        "[Map]": Array.from(value.entries(), ([key, entryValue]) => [
          toSerializable(key, options, depth + 1, seen),
          toSerializable(entryValue, options, depth + 1, seen),
        ]),
      };
    }

    if (value instanceof Set) {
      return {
        "[Set]": Array.from(value.values(), (item) =>
          toSerializable(item, options, depth + 1, seen),
        ),
      };
    }

    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = toSerializable(nestedValue, options, depth + 1, seen);
    }

    for (const symbolKey of Object.getOwnPropertySymbols(value)) {
      if (Object.prototype.propertyIsEnumerable.call(value, symbolKey)) {
        result[String(symbolKey)] = toSerializable(
          Reflect.get(value, symbolKey),
          options,
          depth + 1,
          seen,
        );
      }
    }

    const prototype = Object.getPrototypeOf(value);
    const isPlainObject = prototype === Object.prototype || prototype === null;

    if (!isPlainObject && Object.keys(result).length === 0) {
      return inspectFallback(value, options);
    }

    return result;
  } catch {
    return inspectFallback(value, options);
  } finally {
    seen.delete(value);
  }
}

function format(message: unknown, options: ResolvedLoggerSerializationOptions): string {
  if (message instanceof Error) {
    return message.stack ?? `${message.name}: ${message.message}`;
  }

  const serialized = toSerializable(message, options);

  if (typeof serialized === "string") {
    return serialized;
  }

  if (serialized === null || typeof serialized === "number" || typeof serialized === "boolean") {
    return String(serialized);
  }

  return JSON.stringify(serialized, null, 2);
}

function timestamp(): string {
  return new Date().toISOString();
}

function combinePrefixes(parentPrefix: string, childPrefix?: string): string {
  const segments = [parentPrefix, childPrefix]
    .map((segment) => segment?.trim())
    .filter((segment): segment is string => Boolean(segment));

  return segments.join(" ");
}

function resolveLevelColors(levelColors?: LoggerLevelColors): Record<LogLevel, ColorName> {
  const resolved: Record<LogLevel, ColorName> = {
    ...DEFAULT_LEVEL_COLORS,
  };

  if (!levelColors) {
    return resolved;
  }

  for (const level of Object.values(LogLevel)) {
    const color = levelColors[level];
    if (color === undefined) {
      continue;
    }

    if (!(color in COLOR_CODES)) {
      throw new TypeError(`Unknown color for level "${level}": ${String(color)}`);
    }

    resolved[level] = color;
  }

  return resolved;
}

function resolveLevelLabels(levelLabels?: LoggerLevelLabels): Record<LogLevel, string> {
  const resolved: Record<LogLevel, string> = {
    ...DEFAULT_LEVEL_LABELS,
  };

  if (!levelLabels) {
    return resolved;
  }

  for (const level of Object.values(LogLevel)) {
    const label = levelLabels[level];
    if (label === undefined) {
      continue;
    }

    resolved[level] = String(label);
  }

  return resolved;
}

export class Logger {
  private currentLevel: LogLevel = LogLevel.Debug;
  private showTime: boolean;
  private format: LogFormat;
  private serializationOptions: ResolvedLoggerSerializationOptions;
  private prefix: string;
  private levelColors: Record<LogLevel, ColorName>;
  private levelLabels: Record<LogLevel, string>;
  private readonly styleOptionKeys = new Set([
    "color",
    "bgColor",
    "rgb",
    "bgRgb",
    "hex",
    "bgHex",
    "modifiers",
  ]);

  constructor();
  constructor(options: LoggerOptions);
  constructor(options: LoggerOptions = {}) {
    this.showTime = options.showTime ?? false;
    this.format = options.format ?? "pretty";
    this.currentLevel = options.logLevel ?? LogLevel.Debug;
    this.serializationOptions = resolveSerializationOptions(options.serialization);
    this.prefix = options.prefix?.trim() ?? "";
    this.levelColors = resolveLevelColors(options.levelColors);
    this.levelLabels = resolveLevelLabels(options.levelLabels);
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  child(options: LoggerChildOptions = {}): Logger {
    return new Logger({
      showTime: this.showTime,
      format: this.format,
      logLevel: this.currentLevel,
      serialization: {
        depth: this.serializationOptions.depth,
        inspect: {
          depth: this.serializationOptions.inspect.depth,
          compact: this.serializationOptions.inspect.compact,
        },
      },
      prefix: combinePrefixes(this.prefix, options.prefix),
      levelColors: {
        ...this.levelColors,
      },
      levelLabels: {
        ...this.levelLabels,
      },
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[this.currentLevel];
  }

  private withPrefixedArgs(args: string[]): string[] {
    if (!this.prefix) {
      return args;
    }

    if (args.length === 0) {
      return [this.prefix];
    }

    return [`${this.prefix} ${args[0]}`, ...args.slice(1)];
  }

  private withPrefixedSerializableArgs(args: unknown[]): unknown[] {
    if (!this.prefix) {
      return args;
    }

    if (args.length === 0) {
      return [this.prefix];
    }

    if (typeof args[0] === "string") {
      return [`${this.prefix} ${args[0]}`, ...args.slice(1)];
    }

    return [this.prefix, ...args];
  }

  private isStyleOptionsCandidate(obj: unknown): obj is StyleOptions {
    if (typeof obj !== "object" || obj === null) return false;
    const keys = Object.keys(obj);
    if (keys.length === 0) return false;
    return keys.every((key) => this.styleOptionKeys.has(key));
  }

  private isRgbTriplet(value: unknown): value is [number, number, number] {
    return (
      Array.isArray(value) &&
      value.length === 3 &&
      value.every((v) => typeof v === "number" && Number.isFinite(v))
    );
  }

  private validateStyleOptions(options: StyleOptions): void {
    if (options.color && !(options.color in COLOR_CODES)) {
      throw new TypeError(`Unknown color: ${String(options.color)}`);
    }

    if (options.bgColor && !(options.bgColor in BG_COLOR_CODES)) {
      throw new TypeError(`Unknown background color: ${String(options.bgColor)}`);
    }

    if (options.rgb && !this.isRgbTriplet(options.rgb)) {
      throw new TypeError("`rgb` must be a tuple with 3 finite numbers.");
    }

    if (options.bgRgb && !this.isRgbTriplet(options.bgRgb)) {
      throw new TypeError("`bgRgb` must be a tuple with 3 finite numbers.");
    }

    const hexPattern = /^#?[\da-f]{3}([\da-f]{3})?$/i;
    if (options.hex && !hexPattern.test(options.hex)) {
      throw new TypeError("`hex` must be a valid 3 or 6 digit hex value.");
    }

    if (options.bgHex && !hexPattern.test(options.bgHex)) {
      throw new TypeError("`bgHex` must be a valid 3 or 6 digit hex value.");
    }

    if (options.modifiers) {
      const modifiers = Array.isArray(options.modifiers) ? options.modifiers : [options.modifiers];

      if (modifiers.length === 0) {
        throw new TypeError("`modifiers` must contain at least one modifier.");
      }

      for (const modifier of modifiers) {
        if (!(modifier in MODIFIER_CODES)) {
          throw new TypeError(`Unknown modifier: ${String(modifier)}`);
        }
      }
    }
  }

  private leveledLog(level: LogLevel, ...args: unknown[]) {
    if (!this.shouldLog(level)) return;

    const output = level === LogLevel.Error ? console.error : console.log;
    const formattedArgs = this.withPrefixedArgs(
      args.map((arg) => format(arg, this.serializationOptions)),
    );

    if (this.format === "json") {
      const serializedArgs = this.withPrefixedSerializableArgs(
        args.map((arg) => toSerializable(arg, this.serializationOptions)),
      );
      const firstError = args.find((arg): arg is Error => arg instanceof Error);

      const payload: {
        level: LogLevel;
        time: string;
        message: string;
        args: unknown[];
        error?: ReturnType<typeof serializeError>;
      } = {
        level,
        time: timestamp(),
        message: formattedArgs.join(" "),
        args: serializedArgs,
      };

      if (firstError) {
        payload.error = serializeError(firstError);
      }

      output(JSON.stringify(payload));
      return;
    }

    const color = this.levelColors[level];
    const label = this.levelLabels[level];

    const prefix = styled.bold[color](`[${label}]`);
    const time = this.showTime ? (shouldUseColor() ? styled.dim(timestamp()) : timestamp()) : "";

    output(`${prefix}${this.showTime ? " " + time : ""}`, ...formattedArgs);
  }

  log(...args: unknown[]) {
    const hasOptions = args.length > 1 && this.isStyleOptionsCandidate(args[args.length - 1]);
    if (hasOptions) {
      const options = args.pop() as StyleOptions;
      this.validateStyleOptions(options);

      let s = styled;
      if (options.color) s = s[options.color];
      if (options.bgColor) s = s[options.bgColor];
      if (options.rgb) s = s.rgb(...options.rgb);
      if (options.bgRgb) s = s.bgRgb(...options.bgRgb);
      if (options.hex) s = s.hex(options.hex);
      if (options.bgHex) s = s.bgHex(options.bgHex);
      if (options.modifiers) {
        const mods = Array.isArray(options.modifiers) ? options.modifiers : [options.modifiers];
        for (const mod of mods) {
          s = s[mod];
        }
      }
      console.log(
        s(
          this.withPrefixedArgs(args.map((arg) => format(arg, this.serializationOptions))).join(
            " ",
          ),
        ),
      );
    } else {
      if (!this.prefix) {
        console.log(...args);
        return;
      }

      if (args.length === 0) {
        console.log(this.prefix);
        return;
      }

      if (typeof args[0] === "string") {
        console.log(`${this.prefix} ${args[0]}`, ...args.slice(1));
        return;
      }

      console.log(this.prefix, ...args);
    }
  }

  debug(...args: unknown[]) {
    this.leveledLog(LogLevel.Debug, ...args);
  }

  info(...args: unknown[]) {
    this.leveledLog(LogLevel.Info, ...args);
  }

  success(...args: unknown[]) {
    this.leveledLog(LogLevel.Success, ...args);
  }

  warn(...args: unknown[]) {
    this.leveledLog(LogLevel.Warn, ...args);
  }

  error(...args: unknown[]) {
    this.leveledLog(LogLevel.Error, ...args);
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

const baseLogger = createLogger({ showTime: true });

type LoggerStyledCallable = (text: string) => void;
type LoggerStyledChain = LoggerStyledCallable & typeof styled;

export type StyledLogger = Logger & typeof styled;

function createLoggerStyled(currentStyle: typeof styled = styled): LoggerStyledChain {
  const fn: LoggerStyledCallable = (text: string) => {
    console.log(currentStyle(text));
  };

  return new Proxy(fn as LoggerStyledChain, {
    get(_, prop: string | symbol) {
      if (prop === "rgb") {
        return (red: number, green: number, blue: number) =>
          createLoggerStyled(currentStyle.rgb(red, green, blue));
      }

      if (prop === "bgRgb") {
        return (red: number, green: number, blue: number) =>
          createLoggerStyled(currentStyle.bgRgb(red, green, blue));
      }

      if (prop === "hex") {
        return (value: string) => createLoggerStyled(currentStyle.hex(value));
      }

      if (prop === "bgHex") {
        return (value: string) => createLoggerStyled(currentStyle.bgHex(value));
      }

      if (typeof prop === "string" && prop in ANSI_CODES) {
        return createLoggerStyled(currentStyle[prop as StyleName]);
      }

      return undefined;
    },
  });
}

export const logger: StyledLogger = new Proxy(baseLogger, {
  get(target, prop) {
    if (typeof prop === "string" && prop in target) {
      const value = target[prop as keyof Logger];
      return typeof value === "function" ? value.bind(target) : value;
    }

    if (prop === "rgb") {
      return (red: number, green: number, blue: number) =>
        createLoggerStyled(styled.rgb(red, green, blue));
    }

    if (prop === "bgRgb") {
      return (red: number, green: number, blue: number) =>
        createLoggerStyled(styled.bgRgb(red, green, blue));
    }

    if (prop === "hex") {
      return (value: string) => createLoggerStyled(styled.hex(value));
    }

    if (prop === "bgHex") {
      return (value: string) => createLoggerStyled(styled.bgHex(value));
    }

    if (typeof prop === "string" && prop in ANSI_CODES) {
      return createLoggerStyled(styled[prop as StyleName]);
    }

    return undefined;
  },
}) as StyledLogger;
