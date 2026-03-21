import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { svgPathBbox } from "svg-path-bbox";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const sourcePath = resolve(projectRoot, "seatcordinate-teatromunicipal.txt");
const outputPath = resolve(projectRoot, "src", "data", "teatroMunicipalGenerated.ts");

const defaultSectionMeta = {
  "Setor 1": { shortLabel: "Setor 1", price: 280, tone: "orange" },
  "Setor 2": { shortLabel: "Setor 2", price: 220, tone: "slate" },
  "Setor 3": { shortLabel: "Setor 3", price: 160, tone: "emerald" },
};

const parseNumber = (value, fallback = 0) => {
  const parsedValue = Number.parseFloat(String(value ?? "").replace("px", "").trim());

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const unique = (values) => [...new Set(values.filter(Boolean))];

const extractTooltipParts = (rawTooltip) =>
  String(rawTooltip ?? "")
    .split(/\(br\)|<br\s*\/?>/gi)
    .map((part) => part.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);

const inferTags = (values) => {
  const joinedValue = values.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const tags = [];

  if (joinedValue.includes("visao parcial") || joinedValue.includes("visao prejudicada")) {
    tags.push("partial-view");
  }

  if (joinedValue.includes("cadeirante")) {
    tags.push("wheelchair");
  }

  if (joinedValue.includes("baixa visao")) {
    tags.push("low-vision");
  }

  if (joinedValue.includes("mobilidade reduzida")) {
    tags.push("reduced-mobility");
  }

  if (joinedValue.includes("ampliado")) {
    tags.push("plus-size");
  }

  return tags;
};

const resolveSeatStatus = ({ available, locked, tags }) => {
  if (available === "0" || locked) {
    return "sold";
  }

  if (tags.includes("wheelchair") || tags.includes("low-vision") || tags.includes("reduced-mobility")) {
    return "accessible";
  }

  return "available";
};

const shouldDropFromBackdrop = (element) => {
  if (element.matches("[data-seat-id]")) {
    return true;
  }

  if (element.matches("[data-sector='true'], [data-info='true']")) {
    return true;
  }

  const className = element.getAttribute("class") ?? "";
  const style = element.getAttribute("style") ?? "";

  if (/\bhide\b/i.test(className)) {
    return true;
  }

  if (/display\s*:\s*none/i.test(style)) {
    return true;
  }

  return false;
};

const collapseEmptyGroups = (root) => {
  let hasChanges = true;

  while (hasChanges) {
    hasChanges = false;

    root.querySelectorAll("g").forEach((group) => {
      if (group.childNodes.length > 0) {
        const hasRenderableContent = Array.from(group.childNodes).some((child) => {
          if (child.nodeType === 3) {
            return child.textContent?.trim();
          }

          return true;
        });

        if (hasRenderableContent) {
          return;
        }
      }

      group.remove();
      hasChanges = true;
    });
  }
};

const sanitizeSvgMarkup = (markup) =>
  String(markup ?? "")
    .replace(/&nbsp;|&#160;|\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();

const rawSvg = readFileSync(sourcePath, "utf8");
const dom = new JSDOM(rawSvg);
const document = dom.window.document;
const svg = document.querySelector("svg#MapRender") ?? document.querySelector("svg");

if (!svg) {
  throw new Error("Nao encontrei o SVG principal em seatcordinate-teatromunicipal.txt");
}

const viewportGroup =
  svg.querySelector(".svg-pan-zoom_viewport") ??
  svg.querySelector("g[id^='viewport-']") ??
  svg;

const viewport = {
  width: parseNumber(svg.getAttribute("width"), 2400),
  height: parseNumber(svg.getAttribute("height"), 2000),
};

const backgroundGroup = viewportGroup.cloneNode(true);
backgroundGroup.removeAttribute("style");
backgroundGroup.removeAttribute("class");
backgroundGroup.querySelectorAll("*").forEach((element) => {
  if (shouldDropFromBackdrop(element)) {
    element.remove();
    return;
  }

  element.removeAttribute("style");
  element.removeAttribute("class");
});

collapseEmptyGroups(backgroundGroup);

const backgroundMarkup = sanitizeSvgMarkup(backgroundGroup.innerHTML);

const sectionAggregates = new Map();
const generatedSeatIds = new Set();

const seats = Array.from(viewportGroup.querySelectorAll("[data-seat-id]"))
  .map((seatNode) => {
    const seatPath = seatNode.getAttribute("d");

    if (!seatPath) {
      return null;
    }

    const tooltipParts = extractTooltipParts(seatNode.getAttribute("data-tooltip"));
    const sectionName = tooltipParts[0] ?? "Setor sem nome";
    const areaLabel = tooltipParts[1] ?? sectionName;
    const rawSeatLabel = tooltipParts[2] ?? seatNode.getAttribute("id") ?? seatNode.getAttribute("data-seat-id");
    const match = rawSeatLabel.match(/^(.+?)-(\d+)$/);
    const row = match?.[1]?.trim() ?? rawSeatLabel.trim();
    const number = Number.parseInt(match?.[2] ?? "0", 10) || 0;
    const tags = inferTags([
      ...tooltipParts,
      seatNode.getAttribute("id") ?? "",
      seatNode.getAttribute("data-seat-type") ?? "",
    ]);
    const status = resolveSeatStatus({
      available: seatNode.getAttribute("data-available"),
      locked: seatNode.getAttribute("data-locked") === "true",
      tags,
    });
    const [minX, minY, maxX, maxY] = svgPathBbox(seatPath);
    const position = {
      x: Number(((minX + maxX) / 2).toFixed(2)),
      y: Number(((minY + maxY) / 2).toFixed(2)),
    };
    const sectionId = slugify(sectionName);
    const areaId = slugify(areaLabel);
    const originalSeatId = seatNode.getAttribute("data-seat-id") ?? seatNode.getAttribute("id") ?? "seat";
    const seatId = `${sectionId}-${areaId}-${slugify(row)}-${number || slugify(rawSeatLabel)}-${originalSeatId}`;
    const sourceFill = seatNode.getAttribute("fill") ?? "#90c84f";
    const sourceOpacity = parseNumber(seatNode.getAttribute("opacity"), 1);

    if (generatedSeatIds.has(seatId)) {
      throw new Error(`ID duplicado detectado durante a importacao: ${seatId}`);
    }

    generatedSeatIds.add(seatId);

    const aggregate = sectionAggregates.get(sectionId) ?? {
      id: sectionId,
      name: sectionName,
      shortLabel: defaultSectionMeta[sectionName]?.shortLabel ?? sectionName,
      price: defaultSectionMeta[sectionName]?.price ?? 180,
      tone: defaultSectionMeta[sectionName]?.tone ?? "slate",
      areas: new Set(),
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    };

    aggregate.areas.add(areaLabel);
    aggregate.minX = Math.min(aggregate.minX, minX);
    aggregate.minY = Math.min(aggregate.minY, minY);
    aggregate.maxX = Math.max(aggregate.maxX, maxX);
    aggregate.maxY = Math.max(aggregate.maxY, maxY);
    sectionAggregates.set(sectionId, aggregate);

    return {
      id: seatId,
      label: rawSeatLabel,
      row,
      number,
      sectionId,
      status,
      area: areaLabel,
      tags: tags.length > 0 ? unique(tags) : undefined,
      position,
      vectorPath: seatPath,
      sourceFill,
      sourceOpacity,
    };
  })
  .filter(Boolean)
  .sort((leftSeat, rightSeat) => {
    if (leftSeat.sectionId !== rightSeat.sectionId) {
      return leftSeat.sectionId.localeCompare(rightSeat.sectionId);
    }

    if (leftSeat.row !== rightSeat.row) {
      return leftSeat.row.localeCompare(rightSeat.row, "pt-BR", { numeric: true });
    }

    return leftSeat.number - rightSeat.number;
  });

const sections = Array.from(sectionAggregates.values())
  .map((section) => ({
    id: section.id,
    name: section.name,
    shortLabel: section.shortLabel,
    price: section.price,
    tone: section.tone,
    description: unique(Array.from(section.areas)).join(" | "),
  }))
  .sort((leftSection, rightSection) => leftSection.name.localeCompare(rightSection.name, "pt-BR", { numeric: true }));

const seatMap = {
  hallName: "Theatro Municipal de Sao Paulo",
  stageLabel: "Palco",
  sections,
  seats,
  notes: [
    `Mapa importado da fonte vetorial oficial com ${seats.length} assentos clicaveis.`,
    "Os paths dos assentos foram preservados, e o fundo da sala vem do proprio SVG oficial sem os hotspots embutidos.",
    "Setores e areas comerciais foram lidos do data-tooltip, o que permite reajustar regras de preco sem refazer a geometria.",
  ],
  variant: "theater",
  viewport,
  backgroundMarkup,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `// Auto-generated by scripts/generate-teatro-municipal-seatmap.mjs\n` +
    `export const teatroMunicipalSeatMap = ${JSON.stringify(seatMap, null, 2)};\n`,
  "utf8",
);

console.log(`Gerado: ${outputPath}`);
console.log(`Assentos importados: ${seats.length}`);
