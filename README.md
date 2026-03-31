# styled-log-ts

A lightweight logger for Node.js/TypeScript that supports:

- 🎨 ANSI color formatting
- 🏷️ Log levels (`info`, `success`, `warn`, `error`, `debug`)
- ✨ Text styling (bold, underline, etc.)
- 🕒 ISO timestamps
- 🔇 Log level filtering (e.g. only show `warn` and above)
- 🧩 Custom formatting

---

## 📦 Installation

Install package in your project:

```bash
npm install styled-log-ts@latest --save
```

---

## 🚀 Usage

### Basic Example

```ts
import { logger } from "styled-log-ts";

logger.info("Hello world");
logger.success("Operation completed");
logger.warn("This is a warning");
logger.error("Something went wrong");
logger.debug("Debug info");
```

### CommonJS

```js
const { logger } = require("styled-log-ts");

logger.info("Hello from CommonJS");
```

---

## 🔇 Log Level Filtering

Control which logs are shown by setting a minimum log level.

### Example

```ts
import { logger } from "styled-log-ts";

// Only show warn, error
logger.setLevel("warn");

logger.info("Hidden"); // ❌ not shown
logger.success("Hidden"); // ❌ not shown
logger.warn("Visible"); // ✅ shown
logger.error("Visible"); // ✅ shown
```

---

### 🧠 Log Level Order

From lowest → highest priority:

```ts
debug < info < success < warn < error;
```

---

## 🎨 Custom Styling

```ts
import { logger } from "styled-log-ts";

logger.log("Custom message", {
  color: "red",
  bgColor: "bgBlack",
  modifiers: ["bold", "underline"],
});
```

---

## 🧩 API

### Logger Methods

| Method               | Description           |
| -------------------- | --------------------- |
| `setLevel(level)`    | Set minimum log level |
| `getLevel()`         | Get current log level |
| `info(msg)`          | Informational message |
| `success(msg)`       | Success message       |
| `warn(msg)`          | Warning message       |
| `error(msg)`         | Error message         |
| `debug(msg)`         | Debug message         |
| `log(text, options)` | Custom styled output  |

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

> Only one of `color` / `rgb` / `hex` may be provided at a time, and only one of `bgColor` / `bgRgb` / `bgHex` may be provided at a time.

---

---

## 📄 License

MIT — free to use and modify.
