import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  BanknoteArrowDown,
  BarChart3,
  CircleAlert,
  Layers3,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { events as catalogSeedEvents, type RuntimeEventData } from "@/data/events";
import { OrganizerAgendaPreviewPanel } from "@/components/producer/OrganizerAgendaPreviewPanel";
import { OrganizerDashboardCharts } from "@/components/producer/OrganizerDashboardCharts";
import { OrganizerEventCard } from "@/components/producer/OrganizerEventCard";
import {
  OrganizerEventEditorDialog,
  type OrganizerEventFormValue,
  type OrganizerEventTemplatePreset,
} from "@/components/producer/OrganizerEventEditorDialog";
import { OrganizerEventPerformanceTable } from "@/components/producer/OrganizerEventPerformanceTable";
import { OrganizerModuleCard } from "@/components/producer/OrganizerModuleCard";
import { OrganizerPayoutInfoCard } from "@/components/producer/OrganizerPayoutInfoCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizerEvents } from "@/hooks/use-organizer-events";
import { hasConfiguredBackendUrl } from "@/lib/backend-http";
import { loadSeatMapData } from "@/server/seat-map-loader";
import {
  archiveOrganizerEvent,
  createOrganizerEvent,
  getOrganizerEventEditor,
  publishOrganizerEvent,
  unpublishOrganizerEvent,
  updateOrganizerEvent,
} from "@/server/api/organizer.api";
import type { OrganizerEventSnapshot, OrganizerPublicationStatus } from "@/server/organizer.service";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type OrganizerEditableRuntimeEvent = RuntimeEventData & {
  publicationStatus?: OrganizerPublicationStatus;
  publishedAt?: string | null;
  startsAt?: string | null;
  serviceFeePerTicket?: number;
  processingFeePerOrder?: number;
  platformFeeRate?: number;
  currency?: string;
};

const DEFAULT_TEMPLATE_SLUG = catalogSeedEvents[0]?.slug ?? "";

const splitCommaValues = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const splitLineValues = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const buildFutureDateTimeValue = (time = "20:00") => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  const [hours, minutes] = time.split(":").map((part) => Number(part));
  futureDate.setHours(Number.isFinite(hours) ? hours : 20, Number.isFinite(minutes) ? minutes : 0, 0, 0);

  const year = futureDate.getFullYear();
  const month = String(futureDate.getMonth() + 1).padStart(2, "0");
  const day = String(futureDate.getDate()).padStart(2, "0");
  const localHours = String(futureDate.getHours()).padStart(2, "0");
  const localMinutes = String(futureDate.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${localHours}:${localMinutes}`;
};

const toDateTimeInput = (value?: string | null) => {
  if (!value) {
    return buildFutureDateTimeValue();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return buildFutureDateTimeValue();
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const slugify = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildDraftSlug = (value: string) => {
  const baseSlug = slugify(value);
  const suffix = Date.now().toString().slice(-6);
  return baseSlug ? `${baseSlug}-${suffix}` : `novo-evento-${suffix}`;
};

const buildDateTokens = (startsAt: string) => {
  const parsed = startsAt ? new Date(startsAt) : new Date();
  const month = parsed.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  const weekday = parsed.toLocaleString("pt-BR", { weekday: "short" }).replace(".", "");

  return {
    month: month.charAt(0).toUpperCase() + month.slice(1),
    day: String(parsed.getDate()).padStart(2, "0"),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    time: `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`,
    startsAtIso: parsed.toISOString(),
  };
};

const buildTemplatePreset = (event: (typeof catalogSeedEvents)[number]): OrganizerEventTemplatePreset => ({
  slug: event.slug,
  title: event.title,
  category: event.category,
  description: event.summary,
  preset: {
    templateSlug: event.slug,
    slug: buildDraftSlug(event.title),
    title: event.title,
    category: event.category,
    city: event.city,
    venueName: event.venueName,
    summary: event.summary,
    description: event.description,
    startsAt: buildFutureDateTimeValue(event.time),
    organizerName: event.details.organizer,
    address: event.details.address,
    openingTime: event.details.openingTime,
    discoveryLabel: event.discoveryLabel,
    salesBadge: event.salesBadge ?? "",
    priceFrom: String(event.priceFrom),
    heroUrl: event.image,
    bannerUrl: event.bannerImage,
    tags: event.tags.join(", "),
    searchTerms: event.searchTerms.join(", "),
    ageRating: event.details.ageRating,
    agePolicy: event.details.agePolicy,
    paymentInfo: event.details.paymentInfo,
    salesInfo: event.details.salesInfo,
    importantNotice: event.details.importantNotice,
    ticketPolicies: event.details.ticketPolicies.join("\n"),
    infoParagraphs: event.details.infoParagraphs.join("\n\n"),
    securityNotes: event.securityNotes.join("\n"),
    publicationStatus: "draft",
  },
});

const createEmptyFormValue = (): OrganizerEventFormValue => ({
  templateSlug: DEFAULT_TEMPLATE_SLUG,
  slug: buildDraftSlug("novo-evento"),
  title: "",
  category: "Shows",
  city: "Sao Paulo / SP",
  venueName: "",
  summary: "",
  description: "",
  startsAt: buildFutureDateTimeValue(),
  organizerName: "",
  address: "",
  openingTime: "",
  discoveryLabel: "",
  salesBadge: "",
  priceFrom: "0",
  heroUrl: "",
  bannerUrl: "",
  tags: "",
  searchTerms: "",
  ageRating: "Livre",
  agePolicy: "",
  paymentInfo: "",
  salesInfo: "",
  importantNotice: "",
  ticketPolicies: "",
  infoParagraphs: "",
  securityNotes: "",
  publicationStatus: "draft",
});

const buildFormValueFromRuntimeEvent = (
  runtimeEvent: OrganizerEditableRuntimeEvent,
  fallbackTemplateSlug: string,
): OrganizerEventFormValue => ({
  templateSlug: fallbackTemplateSlug,
  slug: runtimeEvent.slug,
  title: runtimeEvent.title,
  category: runtimeEvent.category,
  city: runtimeEvent.city,
  venueName: runtimeEvent.venueName,
  summary: runtimeEvent.summary,
  description: runtimeEvent.description,
  startsAt: toDateTimeInput(runtimeEvent.startsAt),
  organizerName: runtimeEvent.details.organizer,
  address: runtimeEvent.details.address,
  openingTime: runtimeEvent.details.openingTime,
  discoveryLabel: runtimeEvent.discoveryLabel,
  salesBadge: runtimeEvent.salesBadge ?? "",
  priceFrom: String(runtimeEvent.priceFrom),
  heroUrl: runtimeEvent.image,
  bannerUrl: runtimeEvent.bannerImage,
  tags: runtimeEvent.tags.join(", "),
  searchTerms: runtimeEvent.searchTerms.join(", "),
  ageRating: runtimeEvent.details.ageRating,
  agePolicy: runtimeEvent.details.agePolicy,
  paymentInfo: runtimeEvent.details.paymentInfo,
  salesInfo: runtimeEvent.details.salesInfo,
  importantNotice: runtimeEvent.details.importantNotice,
  ticketPolicies: runtimeEvent.details.ticketPolicies.join("\n"),
  infoParagraphs: runtimeEvent.details.infoParagraphs.join("\n\n"),
  securityNotes: runtimeEvent.securityNotes.join("\n"),
  publicationStatus: runtimeEvent.publicationStatus ?? "draft",
});

const scaleSeatMapSections = (sections: RuntimeEventData["seatMap"]["sections"], priceFrom: number) => {
  const normalizedPriceFrom = Number.isFinite(priceFrom) ? Math.max(priceFrom, 0) : 0;
  const existingPrices = sections.map((section) => Number(section.price ?? 0)).filter((price) => price > 0);
  const baseMinPrice = existingPrices.length > 0 ? Math.min(...existingPrices) : normalizedPriceFrom || 1;
  const multiplier = baseMinPrice > 0 ? normalizedPriceFrom / baseMinPrice : 1;

  return sections.map((section, index) => ({
    ...section,
    price: roundCurrency(
      Math.max(Number(section.price ?? 0) * multiplier, normalizedPriceFrom && index === 0 ? normalizedPriceFrom : 0),
    ),
  }));
};

const buildRuntimeEventPayload = (
  baseRuntimeEvent: OrganizerEditableRuntimeEvent,
  formValue: OrganizerEventFormValue,
  mode: "create" | "edit",
): OrganizerEditableRuntimeEvent => {
  const numericPriceFrom = Number(formValue.priceFrom ?? 0);
  const scaledSections = scaleSeatMapSections(baseRuntimeEvent.seatMap.sections, numericPriceFrom);
  const normalizedSeats =
    mode === "create"
      ? baseRuntimeEvent.seatMap.seats.map((seat) => ({
          ...seat,
          status: seat.status === "accessible" ? "accessible" : "available",
        }))
      : baseRuntimeEvent.seatMap.seats;
  const seatMap = {
    ...baseRuntimeEvent.seatMap,
    hallName: baseRuntimeEvent.seatMap.hallName || `Sala principal - ${formValue.venueName}`,
    sections: scaledSections,
    seats: normalizedSeats,
    totalSeats: normalizedSeats.length,
    availableSeats: normalizedSeats.filter((seat) => ["available", "accessible"].includes(seat.status)).length,
    sectionStats: Object.fromEntries(
      scaledSections.map((section) => [
        section.id,
        {
          total: normalizedSeats.filter((seat) => seat.sectionId === section.id).length,
          selectable: normalizedSeats.filter(
            (seat) => seat.sectionId === section.id && ["available", "accessible"].includes(seat.status),
          ).length,
        },
      ]),
    ),
  };
  const dateTokens = buildDateTokens(formValue.startsAt);

  return {
    ...baseRuntimeEvent,
    slug: formValue.slug,
    title: formValue.title.trim(),
    image: formValue.heroUrl.trim() || baseRuntimeEvent.image,
    bannerImage: formValue.bannerUrl.trim() || baseRuntimeEvent.bannerImage || formValue.heroUrl.trim(),
    category: formValue.category.trim() || baseRuntimeEvent.category,
    discoveryLabel: formValue.discoveryLabel.trim() || formValue.category.trim() || baseRuntimeEvent.category,
    tags: splitCommaValues(formValue.tags),
    searchTerms: splitCommaValues(formValue.searchTerms),
    salesBadge: formValue.salesBadge.trim() || undefined,
    month: dateTokens.month,
    day: dateTokens.day,
    weekday: dateTokens.weekday,
    time: dateTokens.time,
    city: formValue.city.trim(),
    venueName: formValue.venueName.trim(),
    summary: formValue.summary.trim(),
    description: formValue.description.trim(),
    priceFrom: numericPriceFrom,
    securityNotes: splitLineValues(formValue.securityNotes),
    seatMap,
    details: {
      organizer: formValue.organizerName.trim(),
      address: formValue.address.trim(),
      openingTime: formValue.openingTime.trim(),
      ageRating: formValue.ageRating.trim(),
      agePolicy: formValue.agePolicy.trim(),
      paymentInfo: formValue.paymentInfo.trim(),
      salesInfo: formValue.salesInfo.trim(),
      infoParagraphs: splitLineValues(formValue.infoParagraphs),
      importantNotice: formValue.importantNotice.trim(),
      ticketPolicies: splitLineValues(formValue.ticketPolicies),
    },
    publicationStatus: formValue.publicationStatus,
    publishedAt:
      formValue.publicationStatus === "published"
        ? baseRuntimeEvent.publishedAt ?? new Date().toISOString()
        : null,
    startsAt: dateTokens.startsAtIso,
    serviceFeePerTicket: baseRuntimeEvent.serviceFeePerTicket ?? 18,
    processingFeePerOrder: baseRuntimeEvent.processingFeePerOrder ?? 4.9,
    platformFeeRate: 0.1,
    currency: baseRuntimeEvent.currency ?? "BRL",
  };
};

const runtimeTemplatePromiseBySlug: Record<string, Promise<RuntimeEventData>> = {};

const getTemplateRuntimeEvent = (templateSlug: string) => {
  if (!runtimeTemplatePromiseBySlug[templateSlug]) {
    runtimeTemplatePromiseBySlug[templateSlug] = (async () => {
      const templateEvent = catalogSeedEvents.find((event) => event.slug === templateSlug) ?? catalogSeedEvents[0];

      if (!templateEvent) {
        throw new Error("Nenhum template local foi encontrado para criar o evento.");
      }

      return {
        ...templateEvent,
        seatMap: await loadSeatMapData(templateEvent.seatMap),
      };
    })();
  }

  return runtimeTemplatePromiseBySlug[templateSlug];
};

const OrganizerEventsDashboard = () => {
  const auth = useAuth();
  const snapshot = useOrganizerEvents();
  const [publicationActionSlug, setPublicationActionSlug] = useState<string | null>(null);
  const [archiveActionSlug, setArchiveActionSlug] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorBusy, setEditorBusy] = useState(false);
  const [editorRuntimeEvent, setEditorRuntimeEvent] = useState<OrganizerEditableRuntimeEvent | null>(null);
  const templatePresets = useMemo(() => catalogSeedEvents.map(buildTemplatePreset), []);
  const defaultCreateValue = templatePresets[0]?.preset ?? createEmptyFormValue();
  const [editorFormValue, setEditorFormValue] = useState<OrganizerEventFormValue>({
    ...defaultCreateValue,
    slug: buildDraftSlug(defaultCreateValue.title || "novo-evento"),
  });
  const eventSeedBySlug = useMemo(() => new Map(catalogSeedEvents.map((event) => [event.slug, event])), []);
  const eventMetaBySlug = useMemo(() => {
    const metaBySlug = new Map<string, { dateLabel: string; totalSeats: number | null }>();

    if (!snapshot) {
      return metaBySlug;
    }

    snapshot.events.forEach((eventSnapshot) => {
      const seedEvent = eventSeedBySlug.get(eventSnapshot.event.slug);

      metaBySlug.set(eventSnapshot.event.slug, {
        dateLabel: seedEvent ? `${seedEvent.weekday}, ${seedEvent.day} ${seedEvent.month} - ${seedEvent.time}` : "Data a confirmar",
        totalSeats: seedEvent?.seatMap.totalSeats ?? null,
      });
    });

    return metaBySlug;
  }, [eventSeedBySlug, snapshot]);

  if (!auth.isAuthenticated || !auth.currentAccount) {
    return <Navigate to="/conta/acesso" replace />;
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container flex min-h-[60vh] items-center justify-center py-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Layers3 className="h-4 w-4 animate-pulse" />
            Carregando central do produtor...
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const readyForPayout = Math.max(snapshot.summary.authorizedRevenue - snapshot.summary.platformFeeRevenue, 0);
  const publishedWithoutSales = snapshot.events.filter(
    (event) => event.publicationStatus === "published" && event.totalOrders === 0,
  ).length;
  const topGrossEvent = snapshot.events.find((event) => event.grossRevenue > 0) ?? snapshot.events[0] ?? null;
  const topAttentionEvent = snapshot.attention[0] ?? null;
  const topNotificationEvent =
    [...snapshot.events].sort((left, right) => right.sentNotifications - left.sentNotifications)[0] ?? null;
  const topTicketEvent = [...snapshot.events].sort((left, right) => right.issuedTickets - left.issuedTickets)[0] ?? null;
  const financialLeaders = [...snapshot.events]
    .sort(
      (left, right) =>
        Math.max(right.authorizedRevenue - right.platformFeeRevenue, 0) -
        Math.max(left.authorizedRevenue - left.platformFeeRevenue, 0),
    )
    .slice(0, 6);

  const openCreateDialog = () => {
    const preset = templatePresets[0]?.preset ?? createEmptyFormValue();
    setEditorMode("create");
    setEditorRuntimeEvent(null);
    setEditorFormValue({
      ...preset,
      slug: buildDraftSlug(preset.title || "novo-evento"),
    });
    setEditorOpen(true);
  };

  const handlePublicationToggle = async (eventSnapshot: OrganizerEventSnapshot) => {
    setPublicationActionSlug(eventSnapshot.event.slug);

    try {
      if (eventSnapshot.publicationStatus === "published") {
        await unpublishOrganizerEvent(eventSnapshot.event.slug);
        toast.success("Evento movido para rascunho no backend.");
      } else {
        await publishOrganizerEvent(eventSnapshot.event.slug);
        toast.success("Evento publicado no backend.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar a publicacao do evento.");
    } finally {
      setPublicationActionSlug(null);
    }
  };

  const handleOpenEdit = async (eventSnapshot: OrganizerEventSnapshot) => {
    if (!hasConfiguredBackendUrl) {
      toast.error("A edicao real exige backend configurado.");
      return;
    }

    setEditorBusy(true);

    try {
      const runtimeEvent = (await getOrganizerEventEditor(eventSnapshot.event.slug)) as OrganizerEditableRuntimeEvent;
      const matchingTemplateSlug =
        catalogSeedEvents.find((event) => event.slug === runtimeEvent.slug)?.slug ??
        templatePresets[0]?.slug ??
        DEFAULT_TEMPLATE_SLUG;

      setEditorMode("edit");
      setEditorRuntimeEvent(runtimeEvent);
      setEditorFormValue(buildFormValueFromRuntimeEvent(runtimeEvent, matchingTemplateSlug));
      setEditorOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel abrir o editor do evento.");
    } finally {
      setEditorBusy(false);
    }
  };

  const handleArchive = async (eventSnapshot: OrganizerEventSnapshot) => {
    if (!hasConfiguredBackendUrl) {
      toast.error("O arquivamento real exige backend configurado.");
      return;
    }

    if (!window.confirm(`Arquivar o evento "${eventSnapshot.event.title}"? Ele sai da operacao comercial.`)) {
      return;
    }

    setArchiveActionSlug(eventSnapshot.event.slug);

    try {
      await archiveOrganizerEvent(eventSnapshot.event.slug);
      toast.success("Evento arquivado no backend.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel arquivar o evento.");
    } finally {
      setArchiveActionSlug(null);
    }
  };

  const handleSaveEvent = async (formValue: OrganizerEventFormValue) => {
    setEditorBusy(true);

    try {
      const baseRuntimeEvent =
        editorMode === "edit"
          ? editorRuntimeEvent
          : ((await getTemplateRuntimeEvent(formValue.templateSlug)) as OrganizerEditableRuntimeEvent);

      if (!baseRuntimeEvent) {
        throw new Error("Nao foi possivel montar a base do evento para salvar.");
      }

      const payload = buildRuntimeEventPayload(baseRuntimeEvent, formValue, editorMode);

      if (editorMode === "create") {
        await createOrganizerEvent(payload);
        toast.success("Evento criado no backend e liberado para o modulo do organizador.");
      } else {
        await updateOrganizerEvent(editorRuntimeEvent?.slug ?? formValue.slug, payload);
        toast.success("Evento atualizado no backend.");
      }

      setEditorOpen(false);
      setEditorRuntimeEvent(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o evento.");
    } finally {
      setEditorBusy(false);
    }
  };

  const moduleCards = [
    {
      title: "Cockpit comercial do produtor",
      description:
        "O dashboard agora concentra charts, agenda, preview, tabela detalhada por evento e uma leitura financeira clara por repasse, taxa e ocupacao.",
      detail: `${snapshot.summary.publishedEvents} evento(s) publicados, ${snapshot.summary.totalOrders} pedido(s) totais e ${snapshot.summary.issuedTickets} ingressos emitidos.`,
      tone: "active" as const,
    },
    {
      title: "Repasse e fechamento",
      description:
        "O produtor ja consegue visualizar bloco proprio de repasse com campos operacionais e extrato sintetico para leitura rapida.",
      detail: `${currencyFormatter.format(readyForPayout)} pronto para repasse e ${currencyFormatter.format(snapshot.summary.platformFeeRevenue)} em taxa consolidada.`,
      tone: "active" as const,
    },
    {
      title: "Operacao e risco",
      description:
        "Eventos com fila manual, falha de comunicacao e fee em revisao continuam destacados para nao se perderem no volume comercial.",
      detail: `${snapshot.summary.attentionEvents} evento(s) em atencao e ${snapshot.summary.underReviewOrders} pedido(s) em revisao manual.`,
      tone: "active" as const,
    },
    {
      title: "Governanca ainda pendente",
      description: hasConfiguredBackendUrl
        ? "CRUD, publicacao, despublicacao e arquivamento reais estao no ar, mas ainda faltam lotes, venues, colaboradores e regras formais de repasse."
        : "Sem backend ativo, o produtor continua limitado ao snapshot local do catalogo e nao fecha a operacao real.",
      detail: hasConfiguredBackendUrl
        ? "Os proximos blocos naturais agora sao lotes, multiplas sessoes, dados bancarios, historico formal de repasse e permissoes."
        : "Sem backend configurado nao vale prometer operacao do produtor como fluxo confiavel.",
      tone: "partial" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container space-y-4 py-4">
        <Card className="overflow-hidden border-border bg-card">
          <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Central do produtor
                </div>
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-semibold text-foreground">Cockpit comercial e operacional</h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    A plataforma passa a tratar o produtor como foco principal. Aqui ficam receita, repasse, ocupacao,
                    agenda, preview, risco operacional e atalhos para tomar decisao sem cair num painel generico.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Eventos publicados
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{snapshot.summary.publishedEvents}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {snapshot.summary.eventsWithOrders} com vendas e {publishedWithoutSales} no ar sem operacao.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Bruto transacionado
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.grossRevenue)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Autorizado {currencyFormatter.format(snapshot.summary.authorizedRevenue)} nesta base.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Wallet className="h-4 w-4 text-primary" />
                    Repasse pronto
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{currencyFormatter.format(readyForPayout)}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Fee consolidada {currencyFormatter.format(snapshot.summary.platformFeeRevenue)}.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <CircleAlert className="h-4 w-4 text-primary" />
                    Fila e risco
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{snapshot.summary.underReviewOrders}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {snapshot.summary.attentionEvents} evento(s) pedindo triagem imediata.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    Pos-compra
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{snapshot.summary.sentNotifications}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Comunicacoes disparadas e {snapshot.summary.issuedTickets} ingressos emitidos.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Ticket className="h-4 w-4 text-primary" />
                    Evento lider
                  </div>
                  <p className="mt-3 text-xl font-semibold text-foreground">{topGrossEvent?.event.title ?? "Sem destaque"}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {topGrossEvent ? currencyFormatter.format(topGrossEvent.grossRevenue) : "Ainda sem receita registrada."}
                  </p>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border bg-background xl:border-l xl:border-t-0">
              <div className="space-y-4 p-6">
                <Card className="border-border bg-card">
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Conta ativa</Badge>
                        <p className="text-sm font-semibold text-foreground">{auth.currentAccount.fullName}</p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        O produtor agora opera com uma leitura mais nitida de portfolio, financeiro e repasse. A rota
                        <code> /operacao </code>
                        segue dedicada a administracao da plataforma.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      {hasConfiguredBackendUrl ? (
                        <Button onClick={openCreateDialog}>
                          <Plus className="h-4 w-4" />
                          Novo evento real
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link to={topGrossEvent ? `/eventos/${topGrossEvent.event.slug}` : "/"}>
                          <ArrowRight className="h-4 w-4" />
                          Abrir melhor preview
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/conta">
                          <Ticket className="h-4 w-4" />
                          Conta, pedidos e wallet
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/operacao">
                          <ShieldCheck className="h-4 w-4" />
                          Central da plataforma
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <OrganizerPayoutInfoCard
                  fullName={auth.currentAccount.fullName}
                  document={auth.currentAccount.document}
                  authorizedRevenue={snapshot.summary.authorizedRevenue}
                  platformFeeRevenue={snapshot.summary.platformFeeRevenue}
                  refundedRevenue={snapshot.summary.refundedRevenue}
                />

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <BanknoteArrowDown className="h-4 w-4 text-primary" />
                      Proximo ganho
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(readyForPayout)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Valor liquido hoje, antes do fluxo formal de solicitacao.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <CircleAlert className="h-4 w-4 text-primary" />
                      Risco imediato
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {topAttentionEvent?.event.title ?? "Sem alerta aberto"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {topAttentionEvent
                        ? `${topAttentionEvent.underReviewOrders} pedido(s) em revisao e ${topAttentionEvent.failedNotifications} falha(s).`
                        : "Nenhum evento pedindo triagem agora."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      Comunicacao ativa
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {topNotificationEvent?.event.title ?? "Sem historico relevante"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {topNotificationEvent
                        ? `${topNotificationEvent.sentNotifications} envio(s) e ${topNotificationEvent.analyticsEvents} evento(s) de analytics.`
                        : "Os dados aparecem quando o fluxo pos-compra comeca a operar."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-muted p-2">
            <TabsTrigger value="overview">Visao geral</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="attention">Em atencao</TabsTrigger>
            <TabsTrigger value="quiet">Sem operacao</TabsTrigger>
            <TabsTrigger value="modules">Maturidade</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OrganizerDashboardCharts snapshot={snapshot} eventMetaBySlug={eventMetaBySlug} />
            <OrganizerAgendaPreviewPanel events={snapshot.events} eventMetaBySlug={eventMetaBySlug} />
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bruto</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.grossRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Tudo o que ja entrou no funil financeiro.</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Autorizado</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.authorizedRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Base liquida antes da taxa da etiqueteira.</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Taxa da plataforma</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.platformFeeRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currencyFormatter.format(snapshot.summary.pendingPlatformFeeRevenue)} ainda em fila.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reembolsado</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.refundedRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Leitura rapida do que ja voltou ao comprador.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <OrganizerPayoutInfoCard
                fullName={auth.currentAccount.fullName}
                document={auth.currentAccount.document}
                authorizedRevenue={snapshot.summary.authorizedRevenue}
                platformFeeRevenue={snapshot.summary.platformFeeRevenue}
                refundedRevenue={snapshot.summary.refundedRevenue}
              />

              <Card className="border-border bg-card">
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lideres financeiros</p>
                    <h3 className="text-2xl font-semibold text-foreground">Eventos com maior repasse potencial</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Ranking rapido para o produtor decidir onde concentrar fechamento, acao comercial e conferencia.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {financialLeaders.map((eventSnapshot) => {
                      const payoutReady = Math.max(eventSnapshot.authorizedRevenue - eventSnapshot.platformFeeRevenue, 0);
                      const eventMeta = eventMetaBySlug.get(eventSnapshot.event.slug);

                      return (
                        <div
                          key={eventSnapshot.event.id}
                          className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{eventSnapshot.event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {eventMeta?.dateLabel ?? "Data a confirmar"} - {eventSnapshot.event.venueName}
                            </p>
                          </div>

                          <div className="grid gap-1 text-sm lg:text-right">
                            <p className="font-semibold text-foreground">{currencyFormatter.format(payoutReady)}</p>
                            <p className="text-muted-foreground">
                              Bruto {currencyFormatter.format(eventSnapshot.grossRevenue)} - Fee{" "}
                              {currencyFormatter.format(eventSnapshot.platformFeeRevenue)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <OrganizerEventPerformanceTable events={snapshot.events} eventMetaBySlug={eventMetaBySlug} />

            {snapshot.events.map((eventSnapshot) => (
              <OrganizerEventCard
                key={eventSnapshot.event.id}
                snapshot={eventSnapshot}
                canManagePublication={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                canEdit={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                canArchive={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                publicationBusy={publicationActionSlug === eventSnapshot.event.slug}
                archiveBusy={archiveActionSlug === eventSnapshot.event.slug}
                onPublicationToggle={handlePublicationToggle}
                onEdit={handleOpenEdit}
                onArchive={handleArchive}
              />
            ))}
          </TabsContent>

          <TabsContent value="attention" className="space-y-4">
            {snapshot.attention.length > 0 ? (
              snapshot.attention.map((eventSnapshot) => (
                <OrganizerEventCard
                  key={eventSnapshot.event.id}
                  snapshot={eventSnapshot}
                  canManagePublication={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                  canEdit={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                  canArchive={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                  publicationBusy={publicationActionSlug === eventSnapshot.event.slug}
                  archiveBusy={archiveActionSlug === eventSnapshot.event.slug}
                  onPublicationToggle={handlePublicationToggle}
                  onEdit={handleOpenEdit}
                  onArchive={handleArchive}
                />
              ))
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
                  Nenhum evento exige triagem agora. Quando surgir fila manual, falha de comunicacao ou quebra de operacao,
                  o painel destaca aqui primeiro.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quiet" className="space-y-4">
            {snapshot.quiet.length > 0 ? (
              snapshot.quiet.map((eventSnapshot) => (
                <OrganizerEventCard
                  key={eventSnapshot.event.id}
                  snapshot={eventSnapshot}
                  canManagePublication={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                  canEdit={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                  canArchive={hasConfiguredBackendUrl && eventSnapshot.publicationStatus !== "archived"}
                  publicationBusy={publicationActionSlug === eventSnapshot.event.slug}
                  archiveBusy={archiveActionSlug === eventSnapshot.event.slug}
                  onPublicationToggle={handlePublicationToggle}
                  onEdit={handleOpenEdit}
                  onArchive={handleArchive}
                />
              ))
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
                  Todos os eventos publicados ja receberam algum sinal comercial ou operacional neste ambiente.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {moduleCards.map((moduleCard) => (
                <OrganizerModuleCard
                  key={moduleCard.title}
                  title={moduleCard.title}
                  description={moduleCard.description}
                  detail={moduleCard.detail}
                  tone={moduleCard.tone}
                />
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardContent className="grid gap-4 p-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Leitura executiva
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O painel deixa de ser so lista de eventos e vira uma mesa de comando com charts, agenda e ranking financeiro.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Wallet className="h-4 w-4 text-primary" />
                    Fechamento
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O bloco de repasse agora fica visivel no centro do dashboard, mas ainda precisa virar fluxo real com historico e solicitacao.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Proximo salto
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Agora faz sentido atacar lotes, calendario mais rico, dados bancarios, exportacoes e governanca de produtor.
                  </p>
                </div>
              </CardContent>
            </Card>

            {topTicketEvent ? (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Maior publico emitido</p>
                    <h3 className="text-2xl font-semibold text-foreground">{topTicketEvent.event.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {topTicketEvent.issuedTickets} ingresso(s) emitido(s), {topTicketEvent.totalOrders} pedido(s) e{" "}
                      {currencyFormatter.format(topTicketEvent.grossRevenue)} em bruto.
                    </p>
                  </div>

                  <Button asChild variant="outline">
                    <Link to={`/eventos/${topTicketEvent.event.slug}`}>
                      <ArrowRight className="h-4 w-4" />
                      Abrir pagina publica
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>

      <OrganizerEventEditorDialog
        open={editorOpen}
        mode={editorMode}
        initialValue={editorFormValue}
        templatePresets={templatePresets}
        busy={editorBusy}
        onOpenChange={setEditorOpen}
        onSubmit={handleSaveEvent}
      />

      <SiteFooter />
    </div>
  );
};

export default OrganizerEventsDashboard;
