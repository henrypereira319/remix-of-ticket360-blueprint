import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BarChart3, CalendarRange, CircleAlert, Layers3, Mail, Plus, ShieldCheck, Ticket } from "lucide-react";
import { events as catalogSeedEvents, type RuntimeEventData } from "@/data/events";
import { OrganizerEventCard } from "@/components/producer/OrganizerEventCard";
import {
  OrganizerEventEditorDialog,
  type OrganizerEventFormValue,
  type OrganizerEventTemplatePreset,
} from "@/components/producer/OrganizerEventEditorDialog";
import { OrganizerModuleCard } from "@/components/producer/OrganizerModuleCard";
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
            Carregando meus eventos...
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

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
        catalogSeedEvents.find((event) => event.slug === runtimeEvent.slug)?.slug ?? templatePresets[0]?.slug ?? DEFAULT_TEMPLATE_SLUG;

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
      title: "Meus eventos e vitrine",
      description:
        "O organizador ja consegue navegar pelo catalogo, abrir a pagina publica, entrar no mapa e agora criar ou editar evento real no backend.",
      detail: `${snapshot.summary.publishedEvents} evento(s) publicados nesta base, com rota publica e leitura comercial por evento.`,
      tone: "active" as const,
    },
    {
      title: "Operacao e revisao manual",
      description: "Pedidos em revisao, cancelamentos e coerencia entre pagamento, ticket e notificacao ja possuem um backoffice dedicado.",
      detail: `${snapshot.summary.underReviewOrders} pedido(s) em revisao e ${snapshot.summary.attentionEvents} evento(s) pedindo atencao imediata.`,
      tone: "active" as const,
    },
    {
      title: "Comunicacao e pos-compra",
      description: "O fluxo ja entrega confirmacao, emissao e cancelamento, com rastreabilidade por evento e conta.",
      detail: `${snapshot.summary.sentNotifications} comunicacao(oes) enviadas e wallet local disponivel para os pedidos aprovados.`,
      tone: "active" as const,
    },
    {
      title: "Publicacao, edicao e governanca",
      description: hasConfiguredBackendUrl
        ? "O painel ja salva evento real, publica, despublica e arquiva no backend. Ainda faltam colaboradores, lotes e governanca fina."
        : "CRUD real, despublicacao e governanca de organizacao exigem backend configurado.",
      detail: hasConfiguredBackendUrl
        ? "O proximo passo natural agora e fechar lotes, multiplas sessoes, venues e permissoes de colaboracao."
        : "Sem backend ativo, o organizador ainda fica limitado ao snapshot local do catalogo.",
      tone: hasConfiguredBackendUrl ? ("active" as const) : ("partial" as const),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container space-y-4 py-4">
        <Card className="overflow-hidden border-border bg-card">
          <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Modulo do organizador
                </div>
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-semibold text-foreground">Meus eventos</h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    Painel remote-first para acompanhar catalogo, operacao, comunicacao e sinais comerciais por evento, sem
                    misturar a visao do produtor com a central operacional da plataforma.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Eventos publicados</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.summary.publishedEvents}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {snapshot.summary.eventsWithOrders} com operacao e {snapshot.summary.eventsWithoutOrders} ainda sem venda.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bruto transacionado</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.grossRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Autorizado {currencyFormatter.format(snapshot.summary.authorizedRevenue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fee local</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.platformFeeRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Na fila {currencyFormatter.format(snapshot.summary.pendingPlatformFeeRevenue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pos-compra</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.summary.issuedTickets}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ingressos emitidos e {snapshot.summary.sentNotifications} disparos de comunicacao.
                  </p>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border bg-background xl:border-l xl:border-t-0">
              <div className="space-y-4 p-6">
                <Card className="border-border bg-card">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Conta ativa</Badge>
                      <p className="text-sm font-semibold text-foreground">{auth.currentAccount.fullName}</p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Nesta base, a visao do organizador consolida catalogo, publicacao, pedidos e sinais comerciais por
                      evento. A rota <code>/operacao</code> segue reservada para a administracao da plataforma.
                    </p>

                    <div className="grid gap-2">
                      {hasConfiguredBackendUrl ? (
                        <Button onClick={openCreateDialog}>
                          <Plus className="h-4 w-4" />
                          Novo evento real
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link to="/operacao">
                          <ShieldCheck className="h-4 w-4" />
                          Abrir central de operacao
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/conta">
                          <Ticket className="h-4 w-4" />
                          Abrir conta e wallet
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <CircleAlert className="h-4 w-4 text-primary" />
                      Eventos em atencao
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.summary.attentionEvents}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Eventos com fila manual, falha de comunicacao ou necessidade de revisao.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      Fluxo de comunicacao
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.summary.sentNotifications}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Disparos para confirmacao, revisao, emissao e cancelamento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="portfolio" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-muted p-2">
            <TabsTrigger value="portfolio">Meus eventos</TabsTrigger>
            <TabsTrigger value="attention">Em atencao</TabsTrigger>
            <TabsTrigger value="quiet">Sem operacao</TabsTrigger>
            <TabsTrigger value="modules">Modulos</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
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
                  Nenhum evento exige triagem agora. Assim que surgir fila manual, falha de comunicacao ou outro desvio,
                  ele aparece aqui.
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
                  Todos os eventos do catalogo ja receberam algum sinal operacional nesta base local.
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
                    <CalendarRange className="h-4 w-4 text-primary" />
                    Catalogo
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O catalogo remoto agora consegue listar eventos que nasceram no backend, sem depender so dos seeds
                    locais da vitrine.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Organizacao
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O organizador enxerga receita, tickets, comunicacao, atencao operacional e agora tambem cria, edita e
                    arquiva evento real no banco.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Ticket className="h-4 w-4 text-primary" />
                    Proximo salto
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Os blocos naturais agora sao lotes, multiplas sessoes, venues, mapas e permissoes de colaboracao.
                  </p>
                </div>
              </CardContent>
            </Card>
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
