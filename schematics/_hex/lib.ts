import { create, find } from "@pbuilder/sdk/commons";

export const assertPascal = (value: string, label: string): string => {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(value)) throw new Error(`--${label} must be PascalCase, got "${value}"`);
  return value;
};

export const camel = (pascal: string): string => pascal[0].toLowerCase() + pascal.slice(1);

export const pascal = (camelCase: string): string => camelCase[0].toUpperCase() + camelCase.slice(1);

export const dashed = (pascalCase: string): string => pascalCase.replace(/(?<!^)([A-Z])/g, "-$1").toLowerCase();

/** "TransferMoney" → "Transfer money" */
export const sentence = (pascalCase: string): string => {
  const words = dashed(pascalCase).split("-");
  return [pascal(words[0]), ...words.slice(1)].join(" ");
};

const stripTicks = (cell: string): string => cell.replace(/`/g, "").trim();

/** The body of a `## heading` section, up to the next `## `. */
const section = (markdown: string, heading: string): string => {
  const start = markdown.indexOf(`\n## ${heading}\n`);
  if (start === -1) throw new Error(`domain-model.md has no "## ${heading}" section`);
  const rest = markdown.slice(start + heading.length + 5);
  const end = rest.indexOf("\n## ");
  return end === -1 ? rest : rest.slice(0, end);
};

/** The table rows of a section, header and separator dropped, cells trimmed with backticks kept. */
export const table = (markdown: string, heading: string): string[][] =>
  section(markdown, heading)
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .slice(2)
    .map((line) => line.slice(1, -1).split(/(?<!\\)\|/).map((cell) => cell.trim()));

/** The row whose first cell, without backticks, is `first`. */
export const row = (markdown: string, heading: string, first: string, hint: string): string[] => {
  const found = table(markdown, heading).find((cells) => stripTicks(cells[0]) === first);
  if (!found) throw new Error(`${heading} has no row for ${first} in domain-model.md — ${hint}`);
  return found;
};

/** "`Accounts`, `TransferLog`" → ["Accounts", "TransferLog"] */
export const names = (cell: string): string[] =>
  stripTicks(cell)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

export interface Field {
  name: string;
  type: string;
}

/** "`{ fromAccountId: Guid, amount: decimal }`" → fields, in order. */
export const fields = (cell: string): Field[] => {
  const body = stripTicks(cell).replace(/^\{|\}$/g, "").trim();
  if (body === "") return [];
  return body.split(",").map((pair) => {
    const [name, type] = pair.split(":").map((part) => part.trim());
    if (!name || !type) throw new Error(`cannot read the field "${pair.trim()}" in domain-model.md`);
    return { name, type };
  });
};

export interface Method {
  name: string;
  parameters: Field[];
  returns: string;
}

/** A parameter's C# type, by its name: ids are uuids, amounts are money, anything else is a domain type. */
const parameterType = (name: string): string =>
  /(^id|Id)$/.test(name) ? "Guid" : /amount$/i.test(name) ? "decimal" : pascal(name);

/** A port method's C# return type: every port answers a task. */
const taskOf = (returns: string): string => {
  if (returns === "void") return "Task";
  return `Task<${returns === "Money" ? "decimal" : returns}>`;
};

/** "`Record(transfer) → void` · `ById(id) → Transfer?`" → methods with their C# signatures. */
export const methods = (cell: string): Method[] =>
  cell.split("·").map((text) => {
    const match = /^(\w+)\(([^)]*)\)\s*→\s*(.+)$/.exec(stripTicks(text));
    if (!match) throw new Error(`cannot read the port method "${text.trim()}" in domain-model.md`);
    const [, name, params, returns] = match;
    const parameters = params
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => ({ name: p, type: parameterType(p) }));
    return { name, parameters, returns: taskOf(returns.trim()) };
  });

export const docsPath = (context: string): string => `docs/${dashed(context)}/domain-model.md`;

/** The context's domain model: the docs come first, so a context without one is refused. */
export const readModel = async (context: string): Promise<string> => {
  const path = docsPath(context);
  const model = await find(path).read();
  if (model === undefined) throw new Error(`document the context first: ${path} does not exist`);
  return model;
};

export const readRequired = async (path: string, hint: string): Promise<string> => {
  const text = await find(path).read();
  if (text === undefined) throw new Error(`${path} does not exist — ${hint}`);
  return text;
};

/** Schedules a new file with its final text: no template rendering is involved. */
export const write = (path: string, text: string): void => {
  create(path, { template: text, options: {} });
};

export const paths = (context: string) => ({
  domain: `src/${context}.Domain`,
  application: `src/${context}.Application`,
  infrastructure: `src/${context}.Infrastructure`,
  registration: `src/${context}.Infrastructure/${context}ServiceCollectionExtensions.cs`,
  api: `src/Bank.Api/${context}`,
  endpoints: `src/Bank.Api/${context}/${context}Endpoints.cs`,
  http: `src/Bank.Api/${context}/${context}.http`,
});
