import fs from "node:fs/promises";
import path from "node:path";

async function run() {
  console.log("Starting Teatro Bradesco import pipeline (CommonJS)...");

  const schematicPath = path.resolve(process.cwd(), "temp_assets/schematic.json");
  const seatsPath = path.resolve(process.cwd(), "temp_assets/seats.json");

  const schematicRaw = await fs.readFile(schematicPath, "utf-8");
  const seatsRaw = await fs.readFile(seatsPath, "utf-8");

  const schematic = JSON.parse(schematicRaw);
  const seatsData = JSON.parse(seatsRaw);

  const schematicSectors = schematic.data.sectors || [];
  const seatSectors = seatsData.data.sectors || [];

  const sectorLookup = new Map();

  schematicSectors.forEach((sec) => {
    const rawLabel = sec.seat_map_label || "";
    const name = rawLabel.split(":").pop() || "Unknown Sector";
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    sectorLookup.set(sec.id, { id, name });
  });

  const normalizedSeats = [];
  let maxX = 0;
  let maxY = 0;
  const sectionStats = {};

  seatSectors.forEach((sec) => {
    const sectorInfo = sectorLookup.get(sec.id) || { id: "unknown", name: "Unknown" };
    
    if (!sectionStats[sectorInfo.id]) {
      sectionStats[sectorInfo.id] = { total: 0, selectable: 0 };
    }

    sec.seats.forEach((seat) => {
      const isAvailable = seat.status === "AVAILABLE" || seat.status === "ACCESSIBLE_AVAILABLE";
      const isAccessible = seat.status === "ACCESSIBLE_AVAILABLE";
      const status = isAvailable ? (isAccessible ? "accessible" : "available") : "sold";
      
      const x = parseFloat(seat.x) || 0;
      const y = parseFloat(seat.y) || 0;
      
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;

      sectionStats[sectorInfo.id].total += 1;
      if (isAvailable) sectionStats[sectorInfo.id].selectable += 1;

      normalizedSeats.push({
        id: `${sectorInfo.id}-${seat.line.toLowerCase()}-${seat.line_index}`,
        label: seat.code,
        row: seat.line,
        number: parseInt(seat.line_index, 10),
        sectionId: sectorInfo.id,
        status,
        area: sectorInfo.name,
        position: { x, y }
      });
    });
  });

  const viewportWidth = maxX + 200;
  const viewportHeight = maxY + 200;

  const backgroundShapes = schematic.data.maps?.["_schematic_"] || [];
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewportWidth} ${viewportHeight}" width="100%" height="100%">\n`;
  svgContent += `  <g id="bradesco-background-layer">\n`;

  backgroundShapes.forEach((shape) => {
    if (shape.type === "shape") {
      if (shape.shapeType === "image" && shape.source) {
        const x = shape.position?.[0] || 0;
        const y = shape.position?.[1] || 0;
        const w = shape.dimension?.[0] || 0;
        const h = shape.dimension?.[1] || 0;
        svgContent += `    <image href="${shape.source}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" />\n`;
      } else if (shape.shapeType === "rect") {
        const x = shape.position?.[0] || 0;
        const y = shape.position?.[1] || 0;
        const w = shape.dimension?.[0] || 0;
        const h = shape.dimension?.[1] || 0;
        const fill = shape.color && shape.color !== "rgba(0,0,0,0)" ? shape.color : "transparent";
        svgContent += `    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" />\n`;
        if (shape.text) {
          svgContent += `    <text x="${x + w / 2}" y="${y + h / 2}" fill="#000" font-family="sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">${shape.text}</text>\n`;
        }
      } else if (shape.shapeType === "polygon" && shape.points) {
        const pointsStr = shape.points.map((p) => `${p[0]},${p[1]}`).join(" ");
        const fill = shape.color && shape.color !== "rgba(0,0,0,0)" ? shape.color : "rgba(0,0,0,0.05)";
        const stroke = shape.color && shape.color !== "rgba(0,0,0,0)" ? "none" : "#ccc";
        svgContent += `    <polygon points="${pointsStr}" fill="${fill}" stroke="${stroke}" stroke-width="1" />\n`;
      }
    }
  });

  svgContent += `  </g>\n</svg>`;

  const manifestData = {
    venueId: "teatro-bradesco",
    hallName: "Teatro Bradesco",
    stageLabel: "Palco",
    geometryPath: "/maps/teatro-bradesco-geometry.json",
    backgroundAssetPath: "/seatmaps/teatro-bradesco-background.svg",
    variant: "theater",
    viewport: {
      width: Math.ceil(viewportWidth),
      height: Math.ceil(viewportHeight)
    },
    totalSeats: normalizedSeats.length,
    availableSeats: normalizedSeats.filter(s => s.status === "available" || s.status === "accessible").length,
    notes: [
      "Mapa do Teatro Bradesco importado da fonte operacional (Sympla Bileto).",
      "Geometria normalizada da fonte para o dom&iacute;nio local.",
      "Background separado em camada visual est&aacute;tica."
    ],
    sectionStats: sectionStats,
    sections: Array.from(sectorLookup.values()).map(sec => ({
      id: sec.id,
      name: sec.name,
      shortLabel: sec.name.substring(0, 10),
      price: 150,
      tone: "slate"
    }))
  };

  const manifestTs = `// File generated by scripts/import_bradesco_map.js
import type { EventSeatMap } from "@/data/events";

export const teatroBradescoManifest: EventSeatMap = ${JSON.stringify(manifestData, null, 2)};
`;

  await fs.mkdir(path.resolve(process.cwd(), "public/maps"), { recursive: true });
  await fs.mkdir(path.resolve(process.cwd(), "public/seatmaps"), { recursive: true });

  await fs.writeFile(path.resolve(process.cwd(), "public/seatmaps/teatro-bradesco-background.svg"), svgContent);
  await fs.writeFile(path.resolve(process.cwd(), "public/maps/teatro-bradesco-geometry.json"), JSON.stringify({ seats: normalizedSeats }, null, 2));
  await fs.writeFile(path.resolve(process.cwd(), "src/data/teatroBradescoManifest.ts"), manifestTs);

  console.log("Import pipeline complete.");
  console.log(`- Seats imported: ${normalizedSeats.length}`);
  console.log(`- Sectors mapped: ${manifestData.sections.length}`);
}

run().catch(console.error);
