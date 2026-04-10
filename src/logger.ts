import {
  styled,
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

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
};

function format(message: unknown): string {
  if (message instanceof Error) {
    return message.stack ?? `${message.name}: ${message.message}`;
  }

  if (typeof message === "bigint") {
    return `${message}n`;
  }

  if (typeof message === "object" && message !== null) {
    try {
      const seen = new WeakSet<object>();
      return JSON.stringify(
        message,
        (_, value: unknown) => {
          if (typeof value === "bigint") return `${value}n`;
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack,
            };
          }

          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]";
            seen.add(value);
          }

          return value;
        },
        2,
      );
    } catch {
      return inspect(message, { depth: 4, colors: false, compact: false });
    }
  }

  return String(message);
}

function timestamp(): string {
  return new Date().toISOString();
}

export class Logger {
  private currentLevel: LogLevel = LogLevel.Debug;
  private showTime: boolean;
  private readonly styleOptionKeys = new Set([
    "color",
    "bgColor",
    "rgb",
    "bgRgb",
    "hex",
    "bgHex",
    "modifiers",
  ]);

  constructor(showTime: boolean = false) {
    this.showTime = showTime;
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[this.currentLevel];
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
      throw new TypeError(
        `Unknown background color: ${String(options.bgColor)}`,
      );
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
      const modifiers = Array.isArray(options.modifiers)
        ? options.modifiers
        : [options.modifiers];

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

  private levelColors: Record<LogLevel, StyleName> = {
    debug: "magenta",
    info: "blue",
    success: "green",
    warn: "yellow",
    error: "red",
  };

  private leveledLog(level: LogLevel, ...args: unknown[]) {
    if (!this.shouldLog(level)) return;

    const color = this.levelColors[level];
    const label = level.toUpperCase();

    const prefix = styled.bold[color](`[${label}]`);
    const time = this.showTime
      ? shouldUseColor()
        ? styled.dim(timestamp())
        : timestamp()
      : "";

    console.log(
      `${prefix}${this.showTime ? " " + time : ""}`,
      ...args.map(format),
    );
  }

  log(...args: unknown[]) {
    const hasOptions =
      args.length > 1 && this.isStyleOptionsCandidate(args[args.length - 1]);
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
        const mods = Array.isArray(options.modifiers)
          ? options.modifiers
          : [options.modifiers];
        for (const mod of mods) {
          s = s[mod];
        }
      }
      console.log(s(args.map(format).join(" ")));
    } else {
      console.log(...args);
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

const baseLogger = new Logger(true);

type LoggerStyledCallable = (text: string) => void;
type LoggerStyledChain = LoggerStyledCallable & typeof styled;

export type StyledLogger = Logger & typeof styled;

function createLoggerStyled(
  currentStyle: typeof styled = styled,
): LoggerStyledChain {
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
