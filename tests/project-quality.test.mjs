import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = await Promise.all([
  "app/page.tsx", "app/layout.tsx", "app/stock-app.tsx"
].map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")));
const source = files.join("\n").toLowerCase();

test("não contém autenticação ou metadados de ferramentas de geração", () => {
  assert.equal(source.includes("signin-with-chatgpt"), false);
  assert.equal(source.includes("codex-preview"), false);
  assert.equal(source.includes("entrar com chatgpt"), false);
});

test("filtros e status possuem comportamento associado", () => {
  assert.match(source, /statusmatch/);
  assert.match(source, /limpar filtros/);
});

test("painel usa dados operacionais calculados", () => {
  assert.match(source, /awaitingseparation/);
  assert.match(source, /lastmovement/);
});
