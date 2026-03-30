export const COLOR_CODES = {
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  lightGrey: [37, 39],
  lightGray: [37, 39],
  grey: [90, 39],
  gray: [90, 39],
  redBright: [91, 39],
  greenBright: [92, 39],
  yellowBright: [93, 39],
  blueBright: [94, 39],
  magentaBright: [95, 39],
  cyanBright: [96, 39],
  white: [97, 39],
} as const;

export const BG_COLOR_CODES = {
  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgLightGrey: [47, 49],
  bgLightGray: [47, 49],
  bgGrey: [100, 49],
  bgGray: [100, 49],
  bgRedBright: [101, 49],
  bgGreenBright: [102, 49],
  bgYellowBright: [103, 49],
  bgBlueBright: [104, 49],
  bgMagentaBright: [105, 49],
  bgCyanBright: [106, 49],
  bgWhite: [107, 49],
} as const;

export const MODIFIER_CODES = {
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],
  overline: [53, 55],
} as const;

export const ANSI_CODES = {
  ...COLOR_CODES,
  ...BG_COLOR_CODES,
  ...MODIFIER_CODES,
} as const;

export type ColorName = keyof typeof COLOR_CODES;
export type BgColorName = keyof typeof BG_COLOR_CODES;
export type ModifierName = keyof typeof MODIFIER_CODES;
export type StyleName = keyof typeof ANSI_CODES;

const COLOR_NAMES = new Set<string>(Object.keys(COLOR_CODES));
const BG_COLOR_NAMES = new Set<string>(Object.keys(BG_COLOR_CODES));

export interface StyleOptions {
  color?: ColorName;
  bgColor?: BgColorName;
  modifiers?: ModifierName | ModifierName[];
}

type Styled = {
  (text: string): string;
} & {
  [K in StyleName]: Styled;
};

function createStyled(styles: StyleName[] = []): Styled {
  const fn = ((text: string) => {
    const colors = styles.filter((s) => COLOR_NAMES.has(s));
    const bgColors = styles.filter((s) => BG_COLOR_NAMES.has(s));

    if (colors.length > 1) {
      console.warn(
        `[styled] Multiple foreground colors detected: [${colors.join(", ")}]. ` +
          `Only "${colors[0]}" will be applied.`,
      );
    }
    if (bgColors.length > 1) {
      console.warn(
        `[styled] Multiple background colors detected: [${bgColors.join(", ")}]. ` +
          `Only "${bgColors[0]}" will be applied.`,
      );
    }

    return styles.reduce((acc, style) => {
      const codes = ANSI_CODES[style];
      if (!codes) return acc;
      const [open, close] = codes;
      return `\x1b[${open}m${acc}\x1b[${close}m`;
    }, text);
  }) as Styled;

  return new Proxy(fn, {
    get(_, prop: string) {
      if (prop in ANSI_CODES) {
        return createStyled([...styles, prop as StyleName]);
      }
      throw new Error(`Unknown style: ${prop}`);
    },
  });
}

export const styled = createStyled();
