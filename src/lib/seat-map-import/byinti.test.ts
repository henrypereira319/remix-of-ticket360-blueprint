import {
  buildSeatMapFromByintiImport,
  countAccessibleSeats,
  countPartialViewSeats,
  createDefaultSectionPricingRules,
  parseByintiSeatMapMarkup,
} from "./byinti";

const byintiFixture = `
  <div class="q-toolbar-title">Theatro Municipal</div>
  <svg id="MapRender" width="2400px" height="2000px">
    <g id="PALCO_EXTRAS">
      <text>Palco</text>
    </g>

    <g id="Anfiteatro">
      <g id="Anfiteatro_Setor">
        <path data-sectorarea="true" d="M100 100 L300 100 L300 220 L100 220 Z"></path>
      </g>
      <g id="Anfiteatro_Area_de_Assentos">
        <g id="Anfiteatro_Assentos" data-seatgroup="Anfiteatro">
          <path
            d="M110 120 L120 120 L120 130 L110 130 Z"
            data-seat-id="164366"
            data-available="1"
            data-in-cart="0"
            data-seat-type="seat"
            data-tooltip="Setor 3(br)Anfiteatro(br)F-2"
          ></path>
          <path
            d="M140 120 L150 120 L150 130 L140 130 Z"
            data-seat-id="164372"
            data-available="1"
            data-in-cart="0"
            data-seat-type="seat"
            data-tooltip="Setor 3 - Visao parcial(br)Anfiteatro(br)F-14"
          ></path>
          <path
            d="M170 120 L180 120 L180 130 L170 130 Z"
            data-seat-id="165170"
            data-available="0"
            data-in-cart="0"
            data-seat-type="seat"
            data-locked="true"
            data-tooltip="Setor 3 - Cadeirante(br)Anfiteatro(br)F-16"
          ></path>
        </g>
      </g>
      <g id="Anfiteatro_Legendas">
        <text>Anfiteatro</text>
      </g>
    </g>

    <g id="Galeria">
      <g id="Galeria_Setor">
        <path data-sectorarea="true" d="M400 300 L620 300 L620 420 L400 420 Z"></path>
      </g>
      <g id="Galeria_Area_de_Assentos">
        <g id="Galeria_Assentos" data-seatgroup="Galeria">
          <path
            d="M430 330 L440 330 L440 340 L430 340 Z"
            data-seat-id="200001"
            data-available="1"
            data-in-cart="0"
            data-seat-type="seat"
            data-tooltip="Setor 3(br)Galeria(br)A-33"
          ></path>
        </g>
      </g>
      <g id="Galeria_Legendas">
        <text>Galeria</text>
      </g>
    </g>
  </svg>
`;

describe("byinti seat map import", () => {
  it("parses sectors, seats and tags from hydrated markup", () => {
    const draft = parseByintiSeatMapMarkup(byintiFixture);

    expect(draft.hallName).toBe("Theatro Municipal");
    expect(draft.stageLabel).toBe("Palco");
    expect(draft.viewport).toEqual({ width: 2400, height: 2000 });
    expect(draft.sections).toHaveLength(2);
    expect(draft.seats).toHaveLength(4);
    expect(draft.sections[0]).toMatchObject({
      sourceName: "Anfiteatro",
      name: "Anfiteatro",
      seatCount: 3,
      availableSeatCount: 2,
    });
    expect(draft.seats.find((seat) => seat.id === "164372")?.tags).toContain("partial-view");
    expect(draft.seats.find((seat) => seat.id === "165170")?.status).toBe("sold");
    expect(draft.seats.find((seat) => seat.id === "165170")?.tags).toContain("wheelchair");
    expect(draft.seats.find((seat) => seat.id === "164366")?.position).toEqual({ x: 115, y: 125 });
  });

  it("builds a seat map using pricing rules per section", () => {
    const draft = parseByintiSeatMapMarkup(byintiFixture);
    const rules = createDefaultSectionPricingRules(draft, 120).map((rule) =>
      rule.sectionId === draft.sections[0].id
        ? {
            ...rule,
            price: 230,
            tone: "orange",
            name: "Anfiteatro Premium",
            shortLabel: "Anf. Prem.",
          }
        : {
            ...rule,
            price: 140,
            tone: "emerald",
          },
    );

    const seatMap = buildSeatMapFromByintiImport(draft, rules);

    expect(seatMap.variant).toBe("theater");
    expect(seatMap.sections).toHaveLength(2);
    expect(seatMap.sections[0]).toMatchObject({
      id: draft.sections[0].id,
      name: "Anfiteatro Premium",
      shortLabel: "Anf. Prem.",
      price: 230,
      tone: "orange",
    });
    expect(seatMap.sections[1]).toMatchObject({
      id: draft.sections[1].id,
      price: 140,
      tone: "emerald",
    });
    expect(countAccessibleSeats(seatMap)).toBe(1);
    expect(countPartialViewSeats(seatMap)).toBe(1);
    expect(seatMap.notes).toContain("Preco aplicado por regra de setor.");
  });
});
