import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");

/** The repository's own files, by path, to seed a factory test with the real workspace. */
export const repoFiles = (...paths: string[]): Record<string, string> =>
  Object.fromEntries(paths.map((path) => [path, readFileSync(join(root, path), "utf8")]));
