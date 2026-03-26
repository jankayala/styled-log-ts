# styled-log

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
npm install styled-log@latest --save
```

---

## 🚀 Usage

### Basic Example

```ts
import logger from "styled-log";

logger.info("Hello world");
logger.success("Operation completed");
logger.warn("This is a warning");
logger.error("Something went wrong");
logger.debug("Debug info");
```

---

## 🔇 Log Level Filtering

Control which logs are shown by setting a minimum log level.

### Example

```ts
import logger from "styled-log";

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
import logger from "styled-log";

logger.log("Custom message", {
  color: red,
  bgColor: bgBlack,
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
  color?: ColorName;
  bgColor?: BgColorName;
  modifiers?: ModifierName | ModifierName[];
};
```
---

## 🧠 Features

- ✅ Clean and minimal API
- ✅ Fully typed (TypeScript)
- ✅ Multiple styles supported
- ✅ Safe object logging (auto JSON formatting)
- ✅ Log level filtering
- ✅ Easily extensible

---

## 📄 License

MIT — free to use and modify.
