/* Example snippets used by the playground */
(function (global) {
  "use strict";
  var basic = [
    "const { logger, styled } = window.StyledLogBrowser;",
    "logger.info('Hello world');",
    "logger.success('Operation completed');",
    "logger.warn('This is a warning');",
    "logger.error('Something went wrong');",
    "logger.debug('Debug info');",
  ].join("\n");

  var colors = [
    "const { logger, styled } = window.StyledLogBrowser;",
    "logger.log(styled.red.bold('Error:') + ' ' + styled.yellow('Disk almost full'));",
    "logger.info(styled.blue('Connecting to server...'));",
    "logger.success(styled.green('All good'));",
    "logger.log(styled.rgb(255,128,0)('Custom RGB color'));",
  ].join("\n");

  var chaining = [
    "const { logger, styled } = window.StyledLogBrowser;",
    "const label = styled.bgRed.white.bold(' ERROR ');",
    "logger.warn(label + ' ' + styled.yellow('Something might be wrong.'));",
    "logger.log(styled.cyan.underline('Visit:') + ' ' + styled.blue('https://example.com'));",
  ].join("\n");

  var levels = [
    "const { logger, styled } = window.StyledLogBrowser;",
    "logger.setLevel('warn');",
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
