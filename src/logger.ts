import { config } from "./config.js";

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = config.app.logLevel;

// ANSI escape helpers
const esc = (code: string) => `\x1b[${code}m`;
const reset = esc("0");
const dim = esc("2");
const bold = esc("1");
const colors = {
  cyan: esc("36"),
  green: esc("32"),
  yellow: esc("33"),
  red: esc("31"),
  magenta: esc("35"),
  blue: esc("34"),
  white: esc("37"),
  gray: esc("90"),
};

const levelStyles: Record<LogLevel, { symbol: string; color: string; label: string }> = {
  debug: { symbol: "◆", color: colors.magenta, label: "DEBUG" },
  info:  { symbol: "●", color: colors.cyan,    label: "INFO " },
  warn:  { symbol: "▲", color: colors.yellow,  label: "WARN " },
  error: { symbol: "✖", color: colors.red,     label: "ERROR" },
};

const contextColors: Record<string, string> = {
  db:    colors.green,
  mcp:   colors.blue,
  http:  colors.cyan,
  query: colors.magenta,
  tool:  colors.yellow,
};

function timestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

function formatContext(ctx?: string): string {
  if (!ctx) return "";
  const c = contextColors[ctx] || colors.white;
  return ` ${c}[${ctx}]${reset}`;
}

function write(level: LogLevel, msg: string, ctx?: string, extra?: unknown) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const style = levelStyles[level];
  const ts = `${dim}${timestamp()}${reset}`;
  const badge = `${style.color}${bold}${style.symbol} ${style.label}${reset}`;
  const context = formatContext(ctx);

  let line = `${ts} ${badge}${context} ${msg}`;

  if (extra !== undefined) {
    if (extra instanceof Error) {
      line += `\n${dim}  ${extra.stack || extra.message}${reset}`;
    } else if (typeof extra === "object") {
      line += `\n${dim}  ${JSON.stringify(extra, null, 2).split("\n").join(`\n  `)}${reset}`;
    }
  }

  process.stderr.write(line + "\n");
}

export const log = {
  debug: (msg: string, ctx?: string, extra?: unknown) => write("debug", msg, ctx, extra),
  info:  (msg: string, ctx?: string, extra?: unknown) => write("info", msg, ctx, extra),
  warn:  (msg: string, ctx?: string, extra?: unknown) => write("warn", msg, ctx, extra),
  error: (msg: string, ctx?: string, extra?: unknown) => write("error", msg, ctx, extra),

  banner(mode: "stdio" | "http", version: string) {
    const readOnly = config.app.readOnly ? "read-only" : "read-write";
    const logLevel = currentLevel;

    const lines = [
      `${bold}${colors.cyan}┌─────────────────────────────────────────┐${reset}`,
      `${bold}${colors.cyan}│${reset}  ${bold}${colors.white}⚡ postgres-mcp-server${reset}${" ".repeat(19)}${bold}${colors.cyan}│${reset}`,
      `${bold}${colors.cyan}├─────────────────────────────────────────┤${reset}`,
      `${bold}${colors.cyan}│${reset}  ${dim}version${reset}    ${colors.green}${version.padEnd(28)}${reset}${bold}${colors.cyan}│${reset}`,
      `${bold}${colors.cyan}│${reset}  ${dim}transport${reset}  ${colors.green}${mode.padEnd(28)}${reset}${bold}${colors.cyan}│${reset}`,
      `${bold}${colors.cyan}│${reset}  ${dim}mode${reset}       ${colors.green}${readOnly.padEnd(28)}${reset}${bold}${colors.cyan}│${reset}`,
      `${bold}${colors.cyan}│${reset}  ${dim}log level${reset}  ${colors.green}${logLevel.padEnd(28)}${reset}${bold}${colors.cyan}│${reset}`,
      `${bold}${colors.cyan}└─────────────────────────────────────────┘${reset}`,
    ];

    process.stderr.write("\n" + lines.join("\n") + "\n\n");
  },
};
