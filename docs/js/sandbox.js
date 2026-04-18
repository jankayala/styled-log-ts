/* Initializes Monaco, wires UI and runs user's code inside the playground */
(function (global) {
  "use strict";

  // Configure Monaco loader and environment
  if (typeof require === "function") {
    require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs" } });
    window.MonacoEnvironment = {
      getWorkerUrl: function () {
        var blob = new Blob(
          [
            'self.MonacoEnvironment = { baseUrl: "https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/" };',
            'importScripts("https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs/base/worker/workerMain.js");',
          ],
          { type: "text/javascript" },
        );
        return URL.createObjectURL(blob);
      },
    };
  }

  function $(sel) {
    return document.querySelector(sel);
  }

  function appendLine(text, isError) {
    var container = $("#terminal");
    if (!container) return;
    var lines = String(text).split(/\r?\n/);
    lines.forEach(function (ln) {
      var div = document.createElement("div");
      div.className = "terminal-line";
      div.setAttribute("data-testid", isError ? "terminal-error" : "terminal-line");
      // parse ANSI sequences into HTML
      try {
        div.innerHTML = window.ansiParser.toHtml(ln);
      } catch (e) {
        div.textContent = ln;
      }
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }

  // expose append to styled-log replacement
  global.__playgroundAppendOutput = appendLine;

  // keep original console and forward to terminal as well
  global.__origConsole = global.console;
  global.console = {
    log: function () {
      var args = Array.prototype.slice.call(arguments);
      global.__origConsole.log.apply(global.__origConsole, args);
      appendLine(
        args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        false,
      );
    },
    info: function () {
      var args = Array.prototype.slice.call(arguments);
      global.__origConsole.info.apply(global.__origConsole, args);
      appendLine(
        args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        false,
      );
    },
    warn: function () {
      var args = Array.prototype.slice.call(arguments);
      global.__origConsole.warn.apply(global.__origConsole, args);
      appendLine(
        args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        true,
      );
    },
    error: function () {
      var args = Array.prototype.slice.call(arguments);
      global.__origConsole.error.apply(global.__origConsole, args);
      appendLine(
        args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        true,
      );
    },
    debug: function () {
      var args = Array.prototype.slice.call(arguments);
      global.__origConsole.debug.apply(global.__origConsole, args);
      appendLine(
        args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        false,
      );
    },
  };

  // Wait for DOM to be ready before setting up button handlers
  function initButtonHandlers() {
    var exampleButtons = document.querySelectorAll(".example");
    if (!exampleButtons.length) return;

    // Set first button as active on page load
    exampleButtons[0].classList.add("active");

    exampleButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        exampleButtons.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initButtonHandlers);
  } else {
    initButtonHandlers();
  }

  function initEditor(initialValue) {
    require(["vs/editor/editor.main"], function () {
      var editor = monaco.editor.create(document.getElementById("editor"), {
        value: initialValue || (window.PlaygroundSnippets && window.PlaygroundSnippets.basic) || "",
        language: "javascript",
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      });

      window.addEventListener("resize", function () {
        if (editor) {
          editor.layout();
        }
      });

      // wire buttons
      var runBtn = document.getElementById("run-button");
      var themeToggle = document.getElementById("theme-toggle");

      if (themeToggle) {
        themeToggle.addEventListener("click", function () {
          var root = document.documentElement;
          var isLight = root.getAttribute("data-theme") === "light";
          var newTheme = isLight ? "dark" : "light";
          root.setAttribute("data-theme", newTheme);
          monaco.editor.setTheme(newTheme === "light" ? "vs" : "vs-dark");
        });
      }

      runBtn.addEventListener("click", function () {
        var code = editor.getValue();

        // Reset logger state back to default before every run
        if (global.StyledLogBrowser && global.StyledLogBrowser.logger) {
          global.StyledLogBrowser.logger.setLevel("debug");
        }

        // Clear terminal to provide a clean slate for the run
        document.getElementById("terminal").innerHTML = "";

        try {
          // run inside a function so we can provide a console shim
          var fn = new Function("console", "StyledLogBrowser", "with(window){\n" + code + "\n}");
          fn(global.console, global.StyledLogBrowser);
        } catch (err) {
          appendLine(err && err.stack ? err.stack : String(err), true);
        }
      });

      // example buttons
      var map = {
        "example-basic": "basic",
        "example-colors": "colors",
        "example-chaining": "chaining",
        "example-levels": "levels",
      };
      Object.keys(map).forEach(function (btnId) {
        var el = document.querySelector('[data-testid="' + btnId + '"]');
        if (!el) return;
        el.addEventListener("click", function () {
          var key = map[btnId];
          if (window.PlaygroundSnippets && window.PlaygroundSnippets[key]) {
            editor.setValue(window.PlaygroundSnippets[key]);
          }
        });
      });
    });
  }

  // initialize
  if (typeof require === "function") {
    initEditor();
  } else {
    console.error("Monaco loader not available");
  }
})(window);
