/* Example snippets used by the playground */
(function (global) {
  "use strict";
  var basic = [
    "const { createLogger } = window.StyledLogBrowser;",
    "const logger = createLogger();",
    "logger.debug('Debug info');",
    "logger.info('Hello world');",
    "logger.success('Operation completed');",
    "logger.warn('This is a warning');",
    "logger.error('Something went wrong');",
  ].join("\n");

  var colors = [
    "const { logger, styled } = window.StyledLogBrowser;",
    "logger.log(styled.red.bold('Error:') + ' ' + styled.yellow('Disk almost full'));",
    "logger.info(styled.blue('Connecting to server...'));",
    "logger.green('All good');",
    "logger.rgb(255,128,0)('Custom RGB color');",
    "logger.hex('#00FF00')('Custom Hex color');",
  ].join("\n");

  var chaining = [
    "const { logger, styled } = window.StyledLogBrowser;",
    "const label = styled.bgRed.white.bold(' ERROR ');",
    "logger.warn(label + ' ' + styled.yellow('Something might be wrong.'));",
    "logger.log(styled.cyan.underline('Visit:') + ' ' + styled.blue('https://example.com'));",
  ].join("\n");

  var levels = [
    "const { createLogger } = window.StyledLogBrowser;",
    "const options = { showTime: true, logLevel: 'warn' };",
    "const logger = createLogger(options);",
    "logger.debug('This debug will be hidden');",
    "logger.info('Info hidden');",
    "logger.success('Success hidden');",
    "logger.warn('Warn visible');",
    "logger.error('Error visible');",
  ].join("\n");

  global.PlaygroundSnippets = {
    basic: basic,
    colors: colors,
    chaining: chaining,
    levels: levels,
  };
})(window);
