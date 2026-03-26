import { describe, it, expect } from "vitest";
import { teatroBradescoManifest } from "../teatroBradescoManifest";

describe("Teatro Bradesco Normalised Integration", () => {
  it("exports a valid seatMap manifest", () => {
    expect(teatroBradescoManifest).toBeDefined();
    expect(teatroBradescoManifest.venueId).toBe("teatro-bradesco");
    expect(teatroBradescoManifest.variant).toBe("theater");
  });

  it("contains geometry and background paths", () => {
    expect(teatroBradescoManifest.geometryPath).toBe("/maps/teatro-bradesco-geometry.json");
    expect(teatroBradescoManifest.backgroundAssetPath).toBe("/seatmaps/teatro-bradesco-background.svg");
  });

  it("calculates accurate total and available seats automatically", () => {
    expect(teatroBradescoManifest.totalSeats).toBeGreaterThan(400); // 439 in the VIP sector snippet
    expect(teatroBradescoManifest.availableSeats).toBeGreaterThan(0);
  });

  it("maps semantic sectors properly", () => {
    expect(teatroBradescoManifest.sections.length).toBeGreaterThan(0);
    // Sectors like Plateia VIP, Frisas, etc. should be present based on the payload.
    const hasVip = teatroBradescoManifest.sections.some(s => s.name.toUpperCase().includes("VIP") || s.name.toUpperCase().includes("PLATEIA"));
    expect(hasVip).toBe(true);
  });
});
