import { existsSync, readFileSync } from "node:fs";
import { env as processEnv } from "node:process";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

export const DEFAULT_SITE_URL = "https://example.com/";

const MODE_NAME = /^[A-Za-z0-9_-]+$/;

/**
 * Site origin for canonical URLs, RSS, robots.txt, and sitemaps.
 *
 * Astro evaluates `astro.config.ts` through Vite before `.env` files are
 * copied onto `process.env`, and a bundled `process.env.SITE_URL` lookup can
 * be replaced with an empty object. Read `node:process` plus dotenv files
 * using standard file precedence. The process environment wins, then files, then
 * `CF_PAGES_URL` (set by Cloudflare Pages when `SITE_URL` was not injected).
 */
export function resolveSiteUrl({
  mode = processEnv.NODE_ENV || "production",
  cwd = process.cwd(),
  env = processEnv,
} = {}) {
  const fromFiles = readEnvFiles(cwd, mode);
  return (
    firstAbsoluteUrl(env.SITE_URL, fromFiles.SITE_URL) ||
    firstAbsoluteUrl(env.CF_PAGES_URL, fromFiles.CF_PAGES_URL) ||
    DEFAULT_SITE_URL
  );
}

function firstAbsoluteUrl(...values) {
  for (const value of values) {
    const normalized = normalizeSiteUrl(value);
    if (normalized) return normalized;
  }
  return "";
}

function normalizeSiteUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    // Site links are rooted at /; credentials, subpaths and URL parameters
    // are not supported as a site origin.
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return "";
    return url.href;
  } catch {
    return "";
  }
}

function readEnvFiles(cwd, mode) {
  const names = [".env", ".env.local"];
  if (MODE_NAME.test(mode)) {
    names.push(`.env.${mode}`, `.env.${mode}.local`);
  }
  const merged = {};
  for (const name of names) {
    const path = resolve(cwd, name);
    if (!existsSync(path)) continue;
    try {
      Object.assign(merged, parseEnv(readFileSync(path, "utf8")));
    } catch {
      // Unreadable env files should not discard SITE_URL from the process.
    }
  }
  return merged;
}

// NOTE: SITE_URL must be an absolute http(s) URL, e.g. https://chuhai.openoio.com.
// A bare domain without a scheme is silently ignored, and the build falls back
// to CF_PAGES_URL (the *.pages.dev deployment URL).
