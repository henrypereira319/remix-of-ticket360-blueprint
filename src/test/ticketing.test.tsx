import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SeatMap from "@/components/SeatMap";
import { events } from "@/data/events";
import {
  getCheckoutPricing,
  getSelectionSummary,
  parseSeatIdsParam,
  parseTicketCategoriesParam,
  sanitizeSelectedSeatIds,
  sanitizeTicketCategories,
  serializeTicketCategories,
} from "@/lib/ticketing";

describe("event details seat map", () => {
  const event = events[0];
  const theaterEvent = events.find((item) => item.slug === "hamlet-cia-teatro-novo");

  if (!theaterEvent) {
    throw new Error("Theater event not found in fixture");
  }

  it("calcula o total da selecao com base no setor do assento", () => {
    const summary = getSelectionSummary(event, ["premium-a1", "plateia-a-d1"]);

    expect(summary.items).toHaveLength(2);
    expect(summary.total).toBe(450);
  });

  it("permite selecionar apenas assentos disponiveis", () => {
    const onToggleSeat = vi.fn();

    render(<SeatMap seatMap={event.seatMap} selectedSeatIds={[]} onToggleSeat={onToggleSeat} />);

    fireEvent.click(screen.getByRole("button", { name: /Premium Assento A1/i }));

    expect(onToggleSeat).toHaveBeenCalledWith("premium-a1");
    expect(screen.getByRole("button", { name: /Premium Assento A3/i })).toBeDisabled();
  });

  it("sanitiza assentos do checkout e calcula as taxas do pedido", () => {
    const seatIds = sanitizeSelectedSeatIds(
      event,
      parseSeatIdsParam("premium-a1,premium-a1,premium-a3,inexistente,acessivel-j1"),
    );
    const selection = getSelectionSummary(event, seatIds);
    const pricing = getCheckoutPricing(selection.total, selection.items.length);

    expect(seatIds).toEqual(["premium-a1", "acessivel-j1"]);
    expect(pricing.subtotal).toBe(410);
    expect(pricing.serviceFee).toBe(36);
    expect(pricing.processingFee).toBe(4.9);
    expect(pricing.total).toBeCloseTo(450.9);
  });

  it("aplica categoria do ingresso e serializa a revisao antes do checkout", () => {
    const seatIds = sanitizeSelectedSeatIds(event, ["premium-a1", "plateia-a-d1"]);
    const categories = sanitizeTicketCategories(
      event,
      seatIds,
      parseTicketCategoriesParam("premium-a1:half,plateia-a-d1:social"),
    );
    const selection = getSelectionSummary(event, seatIds, categories);

    expect(selection.items[0].ticketCategory).toBe("half");
    expect(selection.items[0].price).toBe(130);
    expect(selection.items[1].ticketCategory).toBe("social");
    expect(selection.items[1].price).toBe(133);
    expect(selection.total).toBe(263);
    expect(serializeTicketCategories(seatIds, categories)).toBe("premium-a1:half,plateia-a-d1:social");
  });

  it("permite focar hotspots do mapa oficial do teatro municipal e inspecionar assentos especiais", () => {
    const onToggleSeat = vi.fn();
    const accessibleSeat = theaterEvent.seatMap.seats.find(
      (seat) => seat.sectionId === "acessibilidade" && seat.tags?.includes("wheelchair"),
    );
    const accessibleSection = theaterEvent.seatMap.sections.find((section) => section.id === "acessibilidade");

    if (!accessibleSeat || !accessibleSection) {
      throw new Error("Accessible seat not found in fixture");
    }

    render(<SeatMap seatMap={theaterEvent.seatMap} selectedSeatIds={[]} onToggleSeat={onToggleSeat} />);

    expect(screen.getByRole("heading", { name: "Setor 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Acessibilidade" })).toBeInTheDocument();
    expect(theaterEvent.seatMap.backgroundImage).toBe("/seatmaps/teatro-municipal-page-1.png");
    expect(theaterEvent.seatMap.seats.length).toBeGreaterThan(1400);

    fireEvent.mouseEnter(
      screen.getByRole("button", {
        name: `${accessibleSection.name} Assento ${accessibleSeat.label} - ${accessibleSection.name}`,
      }),
    );

    expect(screen.getByText(`Assento ${accessibleSeat.label}`)).toBeInTheDocument();
    expect(screen.getAllByText("Acessibilidade").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cadeirante/i).length).toBeGreaterThan(0);
  }, 15000);

  it("ajusta o tamanho dos botoes do mapa quando o zoom aumenta", () => {
    const referenceSeat = theaterEvent.seatMap.seats.find(
      (seat) => seat.sectionId === "setor-1" && seat.status === "available",
    );
    const referenceSection = theaterEvent.seatMap.sections.find((section) => section.id === "setor-1");

    if (!referenceSeat || !referenceSection) {
      throw new Error("Reference seat not found in fixture");
    }

    render(<SeatMap seatMap={theaterEvent.seatMap} selectedSeatIds={[]} onToggleSeat={vi.fn()} />);

    const seatButton = screen.getByRole("button", {
      name: `${referenceSection.name} Assento ${referenceSeat.label} - ${referenceSection.name}`,
    });
    const initialHeight = Number.parseFloat(seatButton.style.height);

    expect(initialHeight).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Aumentar mapa de assentos/i }));

    const zoomedHeight = Number.parseFloat(seatButton.style.height);

    expect(zoomedHeight).toBeGreaterThan(initialHeight);
  }, 15000);
});
