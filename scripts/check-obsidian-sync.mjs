import { execFileSync } from "node:child_process";

function getStagedFiles() {
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" }
  );

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function isTicketMarkdown(file) {
  return file.startsWith("ticket/") && file.toLowerCase().endsWith(".md");
}

function isProjectChange(file) {
  return !file.startsWith("ticket/");
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  process.exit(0);
}

const projectChanges = stagedFiles.filter(isProjectChange);

if (projectChanges.length === 0) {
  process.exit(0);
}

const obsidianNotes = stagedFiles.filter(isTicketMarkdown);

if (obsidianNotes.length > 0) {
  process.exit(0);
}

console.error("");
console.error("Commit bloqueado: mudancas no projeto precisam ser registradas no Obsidian.");
console.error("");
console.error("Arquivos alterados fora de ticket/:");
for (const file of projectChanges) {
  console.error(`- ${file}`);
}
console.error("");
console.error("Antes de commitar, atualize ao menos uma nota Markdown dentro de ticket/.");
console.error("Sugestoes:");
console.error("- ticket/02 - Projeto/Estado Atual.md");
console.error("- ticket/04 - Operacao/Proximos Passos.md");
console.error("- ou a nota especifica da area alterada");
console.error("");

process.exit(1);
