import { readFileSync, writeFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const htmlPath = "docs/Theatro Municipal SP _ Orquestra Experimental de Repertório Apresenta Revisitas_ Satie, Debussy Mussorgsky e Ravel.html";
const outputPath = "seatcordinate-teatromunicipal-EXTRACTED.txt";

try {
  const html = readFileSync(htmlPath, "utf8");
  const dom = new JSDOM(html);
  const svg = dom.window.document.querySelector("svg#MapRender");

  if (svg) {
    writeFileSync(outputPath, svg.outerHTML, "utf8");
    console.log(`SUCESSO: SVG extraido para ${outputPath}`);
  } else {
    console.error("ERRO: Nao encontrei svg#MapRender no HTML.");
  }
} catch (err) {
  console.error(`ERRO ao processar HTML: ${err.message}`);
}
