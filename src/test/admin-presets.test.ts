import { describe, expect, it } from "vitest";
import { teatroBradescoSeatMap } from "@/data/events";
import { adminSeatMapPresets, adminVenuePresets, getAdminSeatMapPresetById, getAdminVenuePresetById } from "@/data/admin";

describe("admin seat map presets", () => {
  it("expoe o preset interno do Teatro Bradesco com mapa teatral consistente", () => {
    const preset = getAdminSeatMapPresetById("teatro-bradesco-oficial");

    expect(preset).toBeDefined();
    expect(preset?.seatMap.hallName).toBe("Teatro Bradesco");
    expect(preset?.seatMap.variant).toBe("theater");
    expect(preset?.capacity).toBe(teatroBradescoSeatMap.seats.length);
    expect(preset?.capacity).toBe(1411);
    expect(preset?.sectionCount).toBe(5);
  });

  it("lista o Teatro Bradesco no catalogo interno de teatros", () => {
    const venue = getAdminVenuePresetById("teatro-bradesco-sp");

    expect(venue).toBeDefined();
    expect(venue?.catalogKind).toBe("theater");
    expect(venue?.defaultSeatMapPresetId).toBe("teatro-bradesco-oficial");
    expect(venue?.seatMapPresetIds).toContain("teatro-bradesco-oficial");
  });

  it("mantem os presets e venues do admin referenciando ids validos", () => {
    const seatMapIds = new Set(adminSeatMapPresets.map((preset) => preset.id));

    adminVenuePresets.forEach((venue) => {
      expect(seatMapIds.has(venue.defaultSeatMapPresetId)).toBe(true);
      venue.seatMapPresetIds.forEach((presetId) => {
        expect(seatMapIds.has(presetId)).toBe(true);
      });
    });
  });
});
