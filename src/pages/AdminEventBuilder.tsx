import { AlertTriangle, Building2, CalendarDays, LayoutTemplate, Save, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import SeatMap from "@/components/SeatMap";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  adminSeatMapPresets,
  adminVenueContainers,
  adminVenuePresets,
  type AdminVenueCatalogKind,
  getAdminSeatMapPresetById,
  getAdminVenuePresetById,
} from "@/data/admin";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  buildSeatMapFromByintiImport,
  countAccessibleSeats,
  countPartialViewSeats,
  createDefaultSectionPricingRules,
  parseByintiSeatMapMarkup,
  type ByintiSectionPricingRule,
  type ByintiSeatMapImportDraft,
} from "@/lib/seat-map-import/byinti";

interface AdminEventDraftFormState {
  id: string;
  title: string;
  slug: string;
  category: string;
  eventDate: string;
  time: string;
  venuePresetId: string;
  seatMapPresetId: string;
  venueName: string;
  city: string;
  address: string;
  organizer: string;
  openingTime: string;
  priceFrom: string;
  summary: string;
  description: string;
  ageRating: string;
  agePolicy: string;
  paymentInfo: string;
  salesInfo: string;
  importantNotice: string;
  securityNotesText: string;
}

interface StoredAdminEventDraft extends AdminEventDraftFormState {
  updatedAt: string;
  createdBy: string;
}

const STORAGE_KEY = "ticket360.admin-event-drafts";
const categories = ["Teatro", "Show", "Concerto", "Festival", "Comedy", "Corporativo"];
const sectionToneOptions: { value: ByintiSectionPricingRule["tone"]; label: string }[] = [
  { value: "orange", label: "Laranja" },
  { value: "slate", label: "Slate" },
  { value: "emerald", label: "Verde" },
  { value: "violet", label: "Violeta" },
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const readStoredDrafts = () => {
  if (typeof window === "undefined") {
    return [] as StoredAdminEventDraft[];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? (JSON.parse(rawValue) as StoredAdminEventDraft[]) : [];
  } catch {
    return [];
  }
};

const writeStoredDrafts = (drafts: StoredAdminEventDraft[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
};

const getSeatMapBasePrice = (seatMapPresetId: string) => {
  const preset = getAdminSeatMapPresetById(seatMapPresetId);
  if (!preset) {
    return "150";
  }

  return String(Math.min(...preset.seatMap.sections.map((section) => section.price)));
};

const createDraftState = (
  venuePresetId = adminVenuePresets[0].id,
  seatMapPresetId = adminVenuePresets[0].defaultSeatMapPresetId,
): AdminEventDraftFormState => {
  const venuePreset = getAdminVenuePresetById(venuePresetId) ?? adminVenuePresets[0];
  const seatMapPreset =
    getAdminSeatMapPresetById(seatMapPresetId) ??
    getAdminSeatMapPresetById(venuePreset.defaultSeatMapPresetId) ??
    adminSeatMapPresets[0];

  return {
    id: createId(),
    title: "",
    slug: "",
    category: categories[0],
    eventDate: "2026-04-16",
    time: "20:00",
    venuePresetId: venuePreset.id,
    seatMapPresetId: seatMapPreset.id,
    venueName: venuePreset.name,
    city: venuePreset.city,
    address: venuePreset.address,
    organizer: venuePreset.organizerHint,
    openingTime: venuePreset.openingTime,
    priceFrom: getSeatMapBasePrice(seatMapPreset.id),
    summary: "",
    description: "",
    ageRating: "16 anos",
    agePolicy: "Menores devem estar acompanhados pelos responsaveis legais.",
    paymentInfo: "Pix, cartao e reserva corporativa.",
    salesInfo: "Site, app e checkout local com revisao administrativa.",
    importantNotice: "A publicacao do evento deve respeitar o mapa homologado e as regras operacionais.",
    securityNotesText: seatMapPreset.operationalNotes.join("\n"),
  };
};

const formatDraftDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

const formatEventDate = (date: string, time: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(
    new Date(`${date}T${time || "20:00"}:00`),
  );

const getSeatMapMinimumPrice = (prices: number[], fallbackPrice: number) => {
  const validPrices = prices.filter((price) => Number.isFinite(price) && price > 0);
  return validPrices.length > 0 ? Math.min(...validPrices) : fallbackPrice;
};

const venueCatalogKindLabel: Record<AdminVenueCatalogKind, string> = {
  theater: "Teatro",
  hall: "Salao",
};

const AdminEventBuilder = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<StoredAdminEventDraft[]>([]);
  const [form, setForm] = useState<AdminEventDraftFormState>(() => createDraftState());
  const [venueCatalogTab, setVenueCatalogTab] = useState<AdminVenueCatalogKind>(adminVenuePresets[0].catalogKind);
  const [importMarkup, setImportMarkup] = useState("");
  const [importDraft, setImportDraft] = useState<ByintiSeatMapImportDraft | null>(null);
  const [importRules, setImportRules] = useState<ByintiSectionPricingRule[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const storedDrafts = readStoredDrafts();
    setDrafts(storedDrafts);
    if (storedDrafts.length > 0) {
      setForm(storedDrafts[0]);
      setVenueCatalogTab(getAdminVenuePresetById(storedDrafts[0].venuePresetId)?.catalogKind ?? adminVenuePresets[0].catalogKind);
    }
  }, []);

  if (!auth.isAuthenticated || !auth.currentAccount) {
    return <Navigate to="/conta/acesso" replace />;
  }

  const selectedVenuePreset = getAdminVenuePresetById(form.venuePresetId) ?? adminVenuePresets[0];
  const availableSeatMaps = adminSeatMapPresets.filter((preset) => selectedVenuePreset.seatMapPresetIds.includes(preset.id));
  const selectedSeatMapPreset =
    availableSeatMaps.find((preset) => preset.id === form.seatMapPresetId) ??
    getAdminSeatMapPresetById(selectedVenuePreset.defaultSeatMapPresetId) ??
    adminSeatMapPresets[0];
  const importedSeatMap = useMemo(
    () => (importDraft ? buildSeatMapFromByintiImport(importDraft, importRules) : null),
    [importDraft, importRules],
  );
  const activeSeatMap = importedSeatMap ?? selectedSeatMapPreset.seatMap;
  const activeSeatMapName = importedSeatMap ? `${importDraft?.hallName} • importado` : selectedSeatMapPreset.name;
  const activeCapacity = activeSeatMap.seats.length;
  const activeAccessibleSeatCount = importedSeatMap
    ? countAccessibleSeats(activeSeatMap)
    : selectedSeatMapPreset.accessibleSeatCount;
  const activePartialViewSeatCount = importedSeatMap
    ? countPartialViewSeats(activeSeatMap)
    : selectedSeatMapPreset.partialViewSeatCount;
  const activeSectionCount = activeSeatMap.sections.length;
  const activePriceFrom = getSeatMapMinimumPrice(
    activeSeatMap.sections.map((section) => section.price),
    Number(form.priceFrom) || selectedSeatMapPreset.basePriceFrom,
  );

  const checklist = [
    { label: "Identidade do evento", done: Boolean(form.title.trim() && form.slug.trim() && form.summary.trim()) },
    { label: "Venue e operacao", done: Boolean(form.venueName.trim() && form.address.trim() && form.organizer.trim()) },
    { label: "Mapa homologado", done: Boolean(activeSeatMap.sections.length > 0 && activePriceFrom > 0) },
    { label: "Politicas publicas", done: Boolean(form.agePolicy.trim() && form.paymentInfo.trim() && form.salesInfo.trim()) },
    { label: "Guardrails internos", done: Boolean(form.importantNotice.trim() && form.securityNotesText.trim()) },
  ];

  const updateField = <K extends keyof AdminEventDraftFormState>(field: K, value: AdminEventDraftFormState[K]) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const updateImportRule = <K extends keyof ByintiSectionPricingRule>(
    sectionId: string,
    field: K,
    value: ByintiSectionPricingRule[K],
  ) => {
    setImportRules((currentRules) =>
      currentRules.map((rule) => (rule.sectionId === sectionId ? { ...rule, [field]: value } : rule)),
    );
  };

  const handleVenuePresetChange = (venuePresetId: string) => {
    const venuePreset = getAdminVenuePresetById(venuePresetId);
    if (!venuePreset) {
      return;
    }

    const nextSeatMapPresetId = venuePreset.defaultSeatMapPresetId;
    setVenueCatalogTab(venuePreset.catalogKind);
    setForm((currentForm) => ({
      ...currentForm,
      venuePresetId,
      seatMapPresetId: nextSeatMapPresetId,
      venueName: venuePreset.name,
      city: venuePreset.city,
      address: venuePreset.address,
      organizer: venuePreset.organizerHint,
      openingTime: venuePreset.openingTime,
      priceFrom: getSeatMapBasePrice(nextSeatMapPresetId),
      securityNotesText:
        getAdminSeatMapPresetById(nextSeatMapPresetId)?.operationalNotes.join("\n") ?? currentForm.securityNotesText,
    }));
  };

  const handleSeatMapPresetChange = (seatMapPresetId: string) => {
    const seatMapPreset = getAdminSeatMapPresetById(seatMapPresetId);
    if (!seatMapPreset) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      seatMapPresetId,
      priceFrom: getSeatMapBasePrice(seatMapPresetId),
      securityNotesText: seatMapPreset.operationalNotes.join("\n"),
    }));
  };

  const handleGenerateSlug = () => {
    if (!form.title.trim()) {
      toast({
        title: "Defina um titulo primeiro",
        description: "O slug depende do nome do evento para ser gerado.",
        variant: "destructive",
      });
      return;
    }

    updateField("slug", slugify(form.title));
  };

  const handleResetFromPreset = () => {
    setForm(createDraftState(form.venuePresetId, form.seatMapPresetId));
    toast({ title: "Formulario recarregado", description: "Campos resetados a partir do preset atual." });
  };

  const handleImportMarkup = () => {
    try {
      const nextImportDraft = parseByintiSeatMapMarkup(importMarkup);
      const nextRules = createDefaultSectionPricingRules(
        nextImportDraft,
        Number(form.priceFrom) || selectedSeatMapPreset.basePriceFrom,
      );

      setImportDraft(nextImportDraft);
      setImportRules(nextRules);
      setImportError(null);

      toast({
        title: "Mapa importado",
        description: `${nextImportDraft.sections.length} setores e ${nextImportDraft.seats.length} assentos detectados.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel importar o mapa informado.";
      setImportDraft(null);
      setImportRules([]);
      setImportError(message);

      toast({
        title: "Falha ao importar mapa",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleClearImportedMap = () => {
    setImportDraft(null);
    setImportRules([]);
    setImportMarkup("");
    setImportError(null);
    toast({ title: "Importacao descartada", description: "Voltamos a usar somente o preset selecionado." });
  };

  const handleSaveDraft = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({
        title: "Campos obrigatorios pendentes",
        description: "Preencha pelo menos titulo e slug antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const nextDraft: StoredAdminEventDraft = {
      ...form,
      updatedAt: new Date().toISOString(),
      createdBy: auth.currentAccount.fullName,
    };

    const nextDrafts = [nextDraft, ...drafts.filter((draft) => draft.id !== nextDraft.id)].slice(0, 6);
    writeStoredDrafts(nextDrafts);
    setDrafts(nextDrafts);
    toast({ title: "Rascunho salvo", description: "O setup ficou guardado neste navegador." });
  };

  const handleLoadDraft = (draft: StoredAdminEventDraft) => {
    setForm(draft);
    setVenueCatalogTab(getAdminVenuePresetById(draft.venuePresetId)?.catalogKind ?? adminVenuePresets[0].catalogKind);
    toast({ title: "Rascunho carregado", description: `Voltamos para ${draft.title || "evento sem titulo"}.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container space-y-4 py-4">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary">Workspace admin local</Badge>
              <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Montagem de evento</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Escolha venues homologados, mapas de sala existentes e preencha as regras operacionais do evento.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/conta">Voltar para a conta</Link>
              </Button>
              <Button type="button" onClick={handleSaveDraft}>
                <Save className="h-4 w-4" />
                Salvar rascunho
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Configuracao do evento</CardTitle>
                <CardDescription>Dados publicos, venue e mapa homologado para a pagina do evento.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Titulo do evento</label>
                  <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Slug</label>
                  <div className="flex gap-2">
                    <Input value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
                    <Button type="button" variant="outline" onClick={handleGenerateSlug}>
                      <Sparkles className="h-4 w-4" />
                      Gerar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Categoria</label>
                  <Select value={form.category} onValueChange={(value) => updateField("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria do evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Venue do catalogo interno</label>
                  <Select value={form.venuePresetId} onValueChange={handleVenuePresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminVenuePresets.map((venuePreset) => (
                        <SelectItem key={venuePreset.id} value={venuePreset.id}>
                          {venueCatalogKindLabel[venuePreset.catalogKind]} • {venuePreset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mapa de sala</label>
                  <Select value={selectedSeatMapPreset.id} onValueChange={handleSeatMapPresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um mapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSeatMaps.map((seatMapPreset) => (
                        <SelectItem key={seatMapPreset.id} value={seatMapPreset.id}>
                          {seatMapPreset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data</label>
                  <Input type="date" value={form.eventDate} onChange={(event) => updateField("eventDate", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Horario</label>
                  <Input value={form.time} onChange={(event) => updateField("time", event.target.value)} placeholder="20:00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Venue exibido</label>
                  <Input value={form.venueName} onChange={(event) => updateField("venueName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cidade / UF</label>
                  <Input value={form.city} onChange={(event) => updateField("city", event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Endereco</label>
                  <Input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Organizador</label>
                  <Input value={form.organizer} onChange={(event) => updateField("organizer", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Abertura dos portoes</label>
                  <Input value={form.openingTime} onChange={(event) => updateField("openingTime", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Preco inicial</label>
                  <Input type="number" min="0" value={form.priceFrom} onChange={(event) => updateField("priceFrom", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Classificacao etaria</label>
                  <Input value={form.ageRating} onChange={(event) => updateField("ageRating", event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Resumo</label>
                  <Textarea value={form.summary} onChange={(event) => updateField("summary", event.target.value)} rows={3} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Descricao</label>
                  <Textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Operacao e publicacao</CardTitle>
                <CardDescription>Regras que abastecem checkout, FAQ operacional e validacao interna.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Politica etaria</label>
                  <Textarea value={form.agePolicy} onChange={(event) => updateField("agePolicy", event.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pagamento e finance</label>
                  <Textarea value={form.paymentInfo} onChange={(event) => updateField("paymentInfo", event.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Canal de vendas</label>
                  <Textarea value={form.salesInfo} onChange={(event) => updateField("salesInfo", event.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Aviso importante</label>
                  <Textarea
                    value={form.importantNotice}
                    onChange={(event) => updateField("importantNotice", event.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Notas internas do mapa</label>
                  <Textarea
                    value={form.securityNotesText}
                    onChange={(event) => updateField("securityNotesText", event.target.value)}
                    rows={5}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleResetFromPreset}>
                    <Sparkles className="h-4 w-4" />
                    Resetar preset
                  </Button>
                  <Button type="button" onClick={handleSaveDraft}>
                    <Save className="h-4 w-4" />
                    Salvar rascunho
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Importacao de mapa real</CardTitle>
                <CardDescription>
                  Cole o HTML ou SVG hidratado do fornecedor, detecte os setores e defina a regra de preco por setor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Markup do fornecedor</label>
                  <Textarea
                    value={importMarkup}
                    onChange={(event) => setImportMarkup(event.target.value)}
                    rows={10}
                    placeholder="Cole aqui o HTML completo ou apenas o <svg> do mapa..."
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Este parser espera o SVG ja hidratado com atributos como data-seat-id, data-available e data-tooltip.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleImportMarkup}>
                    Importar markup
                  </Button>
                  {importDraft ? (
                    <Button type="button" variant="ghost" onClick={handleClearImportedMap}>
                      Descartar importacao
                    </Button>
                  ) : null}
                </div>

                {importError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                    {importError}
                  </div>
                ) : null}

                {importDraft ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-background p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sala detectada</p>
                        <p className="mt-2 text-base font-semibold text-foreground">{importDraft.hallName}</p>
                      </div>
                      <div className="rounded-xl bg-background p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Setores</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{importDraft.sections.length}</p>
                      </div>
                      <div className="rounded-xl bg-background p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assentos</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{importDraft.seats.length}</p>
                      </div>
                    </div>

                    {importDraft.warnings.length > 0 ? (
                      <div className="rounded-2xl border border-amber-300/40 bg-amber-50/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          Warnings da importacao
                        </div>
                        <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                          {importDraft.warnings.map((warning) => (
                            <p key={warning}>{warning}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Regra por setor</p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          O preview passa a usar o mapa importado e os precos abaixo como fonte de verdade comercial.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {importDraft.sections.map((section, sectionIndex) => {
                          const rule =
                            importRules.find((currentRule) => currentRule.sectionId === section.id) ?? {
                              sectionId: section.id,
                              price: Number(form.priceFrom) || selectedSeatMapPreset.basePriceFrom,
                              tone: sectionToneOptions[sectionIndex % sectionToneOptions.length].value,
                              name: section.name,
                              shortLabel: section.shortLabel,
                            };

                          return (
                            <div key={section.id} className="rounded-2xl border border-border bg-background p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{section.sourceName}</p>
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {section.seatCount} assentos no total • {section.availableSeatCount} disponiveis
                                  </p>
                                </div>
                                <Badge variant="outline">{rule.tone}</Badge>
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-4">
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Nome publico
                                  </label>
                                  <Input
                                    value={rule.name ?? section.name}
                                    onChange={(event) => updateImportRule(section.id, "name", event.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Label curta
                                  </label>
                                  <Input
                                    value={rule.shortLabel ?? section.shortLabel}
                                    onChange={(event) => updateImportRule(section.id, "shortLabel", event.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Preco
                                  </label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={String(rule.price)}
                                    onChange={(event) =>
                                      updateImportRule(section.id, "price", Number(event.target.value || "0"))
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Tom visual
                                  </label>
                                  <Select
                                    value={rule.tone}
                                    onValueChange={(value) =>
                                      updateImportRule(section.id, "tone", value as ByintiSectionPricingRule["tone"])
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Escolha o tom" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sectionToneOptions.map((toneOption) => (
                                        <SelectItem key={toneOption.value} value={toneOption.value}>
                                          {toneOption.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Resumo do setup</CardTitle>
                <CardDescription>Conferencia rapida do pacote que sera publicado para o evento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{form.category}</Badge>
                  <Badge variant="outline">{selectedVenuePreset.venueType.replace("-", " ")}</Badge>
                  <Badge variant="outline">{activeCapacity} lugares</Badge>
                  {importedSeatMap ? <Badge>Mapa importado</Badge> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-background p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Agenda
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{formatEventDate(form.eventDate, form.time)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Portoes {form.openingTime || "a definir"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-background p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Building2 className="h-4 w-4 text-primary" />
                      Venue
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{form.venueName}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {form.city}
                      <br />
                      {form.address}
                    </p>
                  </div>

                  <div className="rounded-xl bg-background p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <LayoutTemplate className="h-4 w-4 text-primary" />
                      Mapa homologado
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{activeSeatMapName}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {activeSectionCount} setores e R$ {activePriceFrom} como preco base.
                    </p>
                  </div>

                  <div className="rounded-xl bg-background p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Ticket className="h-4 w-4 text-primary" />
                      Publicacao
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{form.organizer || "Organizador pendente"}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{form.summary || "Resumo ainda nao definido."}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Formatos recomendados</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSeatMapPreset.recommendedFormats.map((format) => (
                      <Badge key={format} variant="secondary">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notas do venue</p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    {selectedVenuePreset.adminNotes.map((note) => (
                      <p key={note}>{note}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Preview do mapa</CardTitle>
                <CardDescription>
                  {importedSeatMap
                    ? "Preview do mapa importado com as regras de preco aplicadas por setor."
                    : "Referencia visual para validar o template de sala sem sair do admin."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.5rem] border border-border bg-background p-3">
                  <div className="pointer-events-none overflow-hidden rounded-[1.25rem]">
                    <SeatMap
                      seatMap={activeSeatMap}
                      selectedSeatIds={[]}
                      onToggleSeat={() => undefined}
                      immersive={false}
                      fullBleed={false}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-background p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Capacidade</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{activeCapacity}</p>
                  </div>
                  <div className="rounded-xl bg-background p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Acessiveis</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{activeAccessibleSeatCount}</p>
                  </div>
                  <div className="rounded-xl bg-background p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Visao parcial</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{activePartialViewSeatCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Container de teatros e saloes</CardTitle>
              <CardDescription>
                Catalogo privado com venues que nossa equipe sobe e homologa para o gerente escolher.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                Tudo aqui e `upload interno`: o time cadastra teatros e saloes homologados, e o gerente so escolhe entre
                os modelos liberados para operacao.
              </div>

              <Tabs value={venueCatalogTab} onValueChange={(value) => setVenueCatalogTab(value as AdminVenueCatalogKind)}>
                <TabsList className="grid w-full grid-cols-2">
                  {adminVenueContainers.map((container) => {
                    const containerCount = adminVenuePresets.filter(
                      (venuePreset) => venuePreset.catalogKind === container.id,
                    ).length;

                    return (
                      <TabsTrigger key={container.id} value={container.id}>
                        {container.name} ({containerCount})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {adminVenueContainers.map((container) => (
                  <TabsContent key={container.id} value={container.id} className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-sm font-semibold text-foreground">{container.name}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{container.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {adminVenuePresets
                        .filter((venuePreset) => venuePreset.catalogKind === container.id)
                        .map((venuePreset) => {
                          const isSelected = venuePreset.id === selectedVenuePreset.id;

                          return (
                            <div key={venuePreset.id} className="rounded-2xl border border-border bg-background p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-lg font-semibold text-foreground">{venuePreset.name}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{venuePreset.city}</p>
                                </div>
                                {isSelected ? <Badge>Atual</Badge> : <Badge variant="outline">Disponivel</Badge>}
                              </div>

                              <p className="mt-3 text-sm leading-6 text-muted-foreground">{venuePreset.address}</p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="secondary">Upload interno</Badge>
                                <Badge variant="secondary">{venueCatalogKindLabel[venuePreset.catalogKind]}</Badge>
                                {venuePreset.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {venuePreset.seatMapPresetIds.length} mapa(s) homologado(s) para este venue
                              </p>

                              <Button
                                type="button"
                                variant={isSelected ? "secondary" : "outline"}
                                className="mt-4 w-full"
                                onClick={() => handleVenuePresetChange(venuePreset.id)}
                              >
                                {isSelected ? "Venue em uso" : "Usar este venue"}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Mapas disponiveis para o venue</CardTitle>
                <CardDescription>Biblioteca filtrada pelo local selecionado com capacidade e tipo de operacao.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableSeatMaps.map((seatMapPreset) => {
                  const isSelected = seatMapPreset.id === selectedSeatMapPreset.id;

                  return (
                    <div key={seatMapPreset.id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{seatMapPreset.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{seatMapPreset.description}</p>
                        </div>
                        {isSelected ? <Badge>Ativo</Badge> : <Badge variant="outline">Template</Badge>}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border px-3 py-3 text-sm text-muted-foreground">
                          <span className="block text-xs uppercase tracking-[0.18em]">Capacidade</span>
                          <span className="mt-2 block font-semibold text-foreground">{seatMapPreset.capacity}</span>
                        </div>
                        <div className="rounded-xl border border-border px-3 py-3 text-sm text-muted-foreground">
                          <span className="block text-xs uppercase tracking-[0.18em]">Setores</span>
                          <span className="mt-2 block font-semibold text-foreground">{seatMapPreset.sectionCount}</span>
                        </div>
                        <div className="rounded-xl border border-border px-3 py-3 text-sm text-muted-foreground">
                          <span className="block text-xs uppercase tracking-[0.18em]">Acessiveis</span>
                          <span className="mt-2 block font-semibold text-foreground">{seatMapPreset.accessibleSeatCount}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant={isSelected ? "secondary" : "outline"}
                        className="mt-4 w-full"
                        onClick={() => handleSeatMapPresetChange(seatMapPreset.id)}
                      >
                        {isSelected ? "Mapa em uso" : "Aplicar este mapa"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Rascunhos locais</CardTitle>
                <CardDescription>Historico salvo no navegador para retomar setups recentes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {drafts.length > 0 ? (
                  drafts.map((draft) => (
                    <div key={draft.id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">{draft.title || "Evento sem titulo"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {draft.venueName} | {draft.category}
                          </p>
                        </div>
                        <Badge variant="outline">{draft.slug || "slug-pendente"}</Badge>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Atualizado em {formatDraftDate(draft.updatedAt)} por {draft.createdBy}.
                      </p>

                      <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => handleLoadDraft(draft)}>
                        Carregar rascunho
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                    Nenhum rascunho salvo ainda. Assim que voce salvar uma configuracao, ela aparece aqui.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Checklist de publicacao</CardTitle>
                <CardDescription>Leitura rapida do que ja esta pronto antes de publicar o evento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Prontidao atual
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {checklist.filter((item) => item.done).length}/{checklist.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O admin ja consegue estruturar venue, mapa, copy e operacao com base nos presets existentes.
                  </p>
                </div>

                {checklist.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <Badge variant={item.done ? "default" : "outline"}>{item.done ? "Pronto" : "Pendente"}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default AdminEventBuilder;
