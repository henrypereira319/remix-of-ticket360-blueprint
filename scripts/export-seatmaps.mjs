import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const geometryOutputDir = path.join(rootDir, "public", "maps");
const manifestOutputPath = path.join(rootDir, "src", "data", "teatroMunicipalManifest.ts");

const geometryModulePath = pathToFileURL(path.join(rootDir, "src", "data", "teatroMunicipalGenerated.ts")).href;
const { teatroMunicipalSeatMap } = await import(geometryModulePath);

const selectableStatuses = new Set(["available", "accessible"]);

const sectionStats = Object.fromEntries(
  teatroMunicipalSeatMap.sections.map((section) => {
    const seats = teatroMunicipalSeatMap.seats.filter((seat) => seat.sectionId === section.id);
    return [
      section.id,
      {
        total: seats.length,
        selectable: seats.filter((seat) => selectableStatuses.has(seat.status)).length,
      },
    ];
  }),
);

const manifest = {
  venueId: "teatro-municipal",
  geometryPath: "/maps/teatro-municipal-geometry.json",
  hallName: teatroMunicipalSeatMap.hallName,
  stageLabel: teatroMunicipalSeatMap.stageLabel,
  sections: teatroMunicipalSeatMap.sections,
  notes: teatroMunicipalSeatMap.notes,
  variant: teatroMunicipalSeatMap.variant,
  viewport: teatroMunicipalSeatMap.viewport,
  totalSeats: teatroMunicipalSeatMap.seats.length,
  availableSeats: teatroMunicipalSeatMap.seats.filter((seat) => selectableStatuses.has(seat.status)).length,
  sectionStats,
};

await fs.mkdir(geometryOutputDir, { recursive: true });
await fs.writeFile(
  path.join(geometryOutputDir, "teatro-municipal-geometry.json"),
  JSON.stringify(teatroMunicipalSeatMap),
  "utf8",
);

const manifestSource = `export const teatroMunicipalManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;
await fs.writeFile(manifestOutputPath, manifestSource, "utf8");

console.log("Seat map geometry exported:", path.join(geometryOutputDir, "teatro-municipal-geometry.json"));
console.log("Seat map manifest exported:", manifestOutputPath);
