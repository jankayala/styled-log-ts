# styled-log-ts

[![CI](https://github.com/jankayala/styled-log-ts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jankayala/styled-log-ts/actions/workflows/ci.yml)

A lightweight logger for Node.js/TypeScript that supports:

- 🎨 ANSI color formatting with automatic color detection
- 🌈 Color policy: respects `NO_COLOR`, `FORCE_COLOR`, and TTY detection
- 🏷️ Log levels (`debug`, `info`, `success`, `warn`, `error`)
- 🧪 Custom per-level labels and colors
- ✨ Text styling (bold, underline, italic, and more)
- 🕒 ISO timestamps
- 🧱 Structured NDJSON mode (`format: "json"`)
- 🔇 Log level filtering (e.g. only show `warn` and above)
- 🧩 Custom formatting via chaining or `StyleOptions`

---

## 📦 Installation

```bash
npm install styled-log-ts@latest --save
```

---

## 🚀 Usage

### Basic Example

`logger` is a ready-to-use singleton with timestamps enabled by default.

```ts
import { createLogger } from "styled-log-ts";

const logger = createLogger({ showTime: true });

logger.debug("Debug info");
logger.info("Hello world");
logger.success("Operation completed");
logger.warn("This is a warning");
logger.error("Something went wrong");
```

### Creating Custom Logger Instances

```ts
import { createLogger } from "styled-log-ts";

// Logger without timestamps (default)
const logger1 = createLogger();
logger1.info("No timestamp"); // [INFO] No timestamp

// Logger with timestamps
const logger2 = createLogger({ showTime: true });
logger2.info("With timestamp"); // [INFO] 2026-01-01T12:30:45.123Z With timestamp

// JSON / NDJSON mode for production pipelines
const logger3 = createLogger({ format: "json" });
logger3.info("service started", { port: 3000 });
// {"level":"info","time":"2026-01-01T12:30:45.123Z","message":"service started {\n  \"port\": 3000\n}","args":["service started",{"port":3000}]}

// Configure nested object serialization and inspect fallback
const logger4 = createLogger({
  serialization: {
    depth: 2,
    inspect: {
      depth: 2,
      compact: true,
    },
  },
});

logger4.info({ deeply: { nested: { value: 42 } } });
// [INFO] {"deeply":{"nested":"[Object]"}}

// Override level colors and labels
const logger5 = createLogger({
  levelColors: { error: "cyan" },
  levelLabels: { error: "FAIL" },
});

logger5.error("database unavailable");
// [FAIL] database unavailable
```

### Child Loggers

```ts
import { createLogger } from "styled-log-ts";

const logger = createLogger({ showTime: true });
const dbLogger = logger.child({ prefix: "[db]" });
const sqlLogger = dbLogger.child({ prefix: "[sql]" });

dbLogger.info("connected");
// [INFO] ... [db] connected

sqlLogger.warn("slow query", { durationMs: 1200 });
// [WARN] ... [db] [sql] slow query {
//   "durationMs": 1200
// }
```

### CommonJS

```js
const { logger } = require("styled-log-ts");

logger.info("Hello from CommonJS");
```

---

## 🌈 Color Policy

Colors are controlled automatically using the following priority order:

| Priority | Condition                                      | Result              |
| -------- | ---------------------------------------------- | ------------------- |
| 1        | `NO_COLOR` env var is set (non-empty)          | Colors **disabled** |
| 2        | `FORCE_COLOR` env var is set (non-empty)       | Colors **enabled**  |
| 3        | `process.stdout.isTTY === true`                | Colors **enabled**  |
| 4        | default (e.g. pipes, CI without `FORCE_COLOR`) | Colors **disabled** |

```bash
# Disable colors (plain text output – great for log files)
NO_COLOR=1 node app.js

# Force colors in CI or piped environments
FORCE_COLOR=1 node app.js
```

You can also use the exported utilities directly:

```ts
import { shouldUseColor, stripAnsi } from "styled-log-ts";

if (shouldUseColor()) {
  console.log("Terminal supports colors");
}

// Remove ANSI sequences from any string
const plain = stripAnsi("\x1b[31mHello\x1b[39m"); // → "Hello"
```

---

## 🔇 Log Level Filtering

Control which logs are shown by setting a minimum log level.

```ts
import { logger } from "styled-log-ts";

// Only show warn and above
logger.setLevel("warn");

logger.info("Hidden"); // ❌ not shown
logger.success("Hidden"); // ❌ not shown
logger.warn("Visible"); // ✅ shown
logger.error("Visible"); // ✅ shown
```

### Log Level Order

From lowest → highest priority:

```
debug < info < success < warn < error
```

---

## 🎨 Custom Styling

### Via `StyleOptions`

```ts
import { logger } from "styled-log-ts";

logger.log("Custom message", {
  color: "red",
  bgColor: "bgBlack",
  modifiers: ["bold", "underline"],
});

// RGB and hex colors are also supported
logger.log("Vivid", { rgb: [255, 128, 0] });
logger.log("Teal bg", { hex: "#00bcd4" });
```

### Via Chaining

```ts
import { logger } from "styled-log-ts";

logger.red.bold("Red bold text");
logger.rgb(50, 150, 255)("Custom RGB text");
logger.hex("#ff6600")("Hex colored text");
logger.bold.underline.cyan("Chained modifiers");
```

### `styled` Utility (standalone)

`styled` can be used independently to build styled strings without logging:

```ts
import { styled } from "styled-log-ts";

const highlighted = styled.bold.yellow("Warning!");
const label = styled.bgRed.white(" ERROR ");
const custom = styled.rgb(100, 200, 50)("Custom RGB");
```

> Colors are automatically stripped when `shouldUseColor()` returns `false`.

---

## 🧩 API

### `logger` (singleton)

A pre-configured `Logger` instance with timestamps enabled.

```ts
import { logger } from "styled-log-ts";
```

### `createLogger` (recommended entry point)

```text
createLogger(options?: LoggerOptions): Logger
```

```ts
import { createLogger } from "styled-log-ts";

const logger = createLogger({ showTime: true, logLevel: "info" });
```

### `Logger` Constructor

```text
new Logger()
new Logger(options?: { showTime?: boolean; format?: "pretty" | "json"; logLevel?: LogLevel; serialization?: { depth?: number; inspect?: { depth?: number; compact?: boolean | number } }; levelColors?: Partial<Record<LogLevel, ColorName>>; levelLabels?: Partial<Record<LogLevel, string>> })
```

| Parameter                       | Type                                   | Default               | Description                                                                       |
| ------------------------------- | -------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `showTime`                      | `boolean`                              | `false`               | Include ISO timestamp prefix (pretty mode)                                        |
| `format`                        | `"pretty" \| "json"`                   | `"pretty"`            | Output mode (`json` emits one NDJSON line per call)                               |
| `logLevel`                      | `LogLevel`                             | `"debug"`             | Initial minimum log level                                                         |
| `levelColors`                   | `Partial<Record<LogLevel, ColorName>>` | defaults per level    | Override per-level pretty output colors (`debug`,`info`,`success`,`warn`,`error`) |
| `levelLabels`                   | `Partial<Record<LogLevel, string>>`    | uppercase level names | Override per-level pretty output labels                                           |
| `serialization.depth`           | `number`                               | `4`                   | Maximum nesting depth before objects/arrays are collapsed to placeholders         |
| `serialization.inspect.depth`   | `number`                               | `4`                   | `inspect()` depth used for fallback formatting                                    |
| `serialization.inspect.compact` | `boolean \| number`                    | `false`               | `inspect()` compactness for fallback formatting                                   |

### Serialization behavior

- `undefined` → `"undefined"`
- `null` → `"null"`
- `Symbol("x")` → `"Symbol(x)"`
- functions → `"[Function: name]"` (or `"[Function (anonymous)]"`)
- circular references → `"[Circular]"`
- nested objects beyond `serialization.depth` → `"[Object]"` / `"[Array]"`

### Logger Methods

| Method               | Description                                 |
| -------------------- | ------------------------------------------- |
| `setLevel(level)`    | Set minimum log level                       |
| `getLevel()`         | Get current log level                       |
| `child({ prefix })`  | Create a child logger with fixed prefix     |
| `debug(...args)`     | Debug message (default color: magenta)      |
| `info(...args)`      | Informational message (default color: blue) |
| `success(...args)`   | Success message (default color: green)      |
| `warn(...args)`      | Warning message (default color: yellow)     |
| `error(...args)`     | Error message (default color: red)          |
| `log(text, options)` | Custom styled output via `StyleOptions`     |

### Color Utilities

| Export           | Signature                  | Description                                     |
| ---------------- | -------------------------- | ----------------------------------------------- |
| `shouldUseColor` | `() => boolean`            | Returns `true` if ANSI colors should be emitted |
| `stripAnsi`      | `(text: string) => string` | Removes all ANSI escape sequences from a string |

---

## 🏷 Log Levels

```ts
type LogLevel = "debug" | "info" | "success" | "warn" | "error";
```

---

## 🎨 Styling Options

```ts
type StyleOptions = {
  // choose only one foreground option
  color?: ColorName;
  rgb?: [number, number, number];
  hex?: string;

  // choose only one background option
  bgColor?: BgColorName;
  bgRgb?: [number, number, number];
  bgHex?: string;

  modifiers?: ModifierName | ModifierName[];
};
```

> Only one of `color` / `rgb` / `hex` may be provided at a time.  
> Only one of `bgColor` / `bgRgb` / `bgHex` may be provided at a time.

### Available Colors (`ColorName`)

`black` · `red` · `green` · `yellow` · `blue` · `magenta` · `cyan` · `white` · `gray` / `grey` · `redBright` · `greenBright` · `yellowBright` · `blueBright` · `magentaBright` · `cyanBright` · `lightGray` / `lightGrey`

### Available Background Colors (`BgColorName`)

`bgBlack` · `bgRed` · `bgGreen` · `bgYellow` · `bgBlue` · `bgMagenta` · `bgCyan` · `bgWhite` · `bgGray` / `bgGrey` · `bgRedBright` · `bgGreenBright` · `bgYellowBright` · `bgBlueBright` · `bgMagentaBright` · `bgCyanBright` · `bgLightGray` / `bgLightGrey`

### Available Modifiers (`ModifierName`)

`bold` · `dim` · `italic` · `underline` · `inverse` · `hidden` · `strikethrough` · `overline`

---

## Consistent Formatting (Any IDE)

This project uses `Prettier` and `EditorConfig`, so formatting stays the same in other editors.

```bash
npm run format
npm run format:check
```

- `npm run format` rewrites files to the project style.
- `npm run format:check` validates formatting (used in CI).

---

## 📄 License

MIT — free to use and modify.
