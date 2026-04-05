import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { OrganizerSnapshot } from "@/server/organizer.service";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactTitle = (value: string) => (value.length > 18 ? `${value.slice(0, 16)}...` : value);

const chartConfig = {
  revenue: {
    label: "Receita bruta",
    color: "hsl(var(--primary))",
  },
  payout: {
    label: "Repasse pronto",
    color: "#0f9d7a",
  },
  approved: {
    label: "Aprovados",
    color: "#0f9d7a",
  },
  underReview: {
    label: "Em revisao",
    color: "#f59e0b",
  },
  cancelled: {
    label: "Cancelados",
    color: "hsl(var(--destructive))",
  },
  ready: {
    label: "Pronto para repasse",
    color: "#0f9d7a",
  },
  fee: {
    label: "Fee plataforma",
    color: "hsl(var(--primary))",
  },
  refunded: {
    label: "Reembolsado",
    color: "hsl(var(--destructive))",
  },
  pending: {
    label: "Fee em fila",
    color: "#f59e0b",
  },
  published: {
    label: "Publicado",
    color: "#0f9d7a",
  },
  draft: {
    label: "Rascunho",
    color: "#7c899c",
  },
  archived: {
    label: "Arquivado",
    color: "#475569",
  },
  cancelledPublication: {
    label: "Cancelado",
    color: "hsl(var(--destructive))",
  },
  occupancy: {
    label: "Ocupacao",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const formatCurrencyTooltip = (value: number, label: string) => (
  <div className="flex min-w-44 items-center justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono font-medium text-foreground">{currencyFormatter.format(value)}</span>
  </div>
);

const formatNumberTooltip = (value: number, label: string, suffix = "") => (
  <div className="flex min-w-32 items-center justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono font-medium text-foreground">
      {value.toLocaleString("pt-BR")}
      {suffix}
    </span>
  </div>
);

export const OrganizerDashboardCharts = ({
  snapshot,
  eventMetaBySlug,
}: {
  snapshot: OrganizerSnapshot;
  eventMetaBySlug: Map<string, { dateLabel: string; totalSeats: number | null }>;
}) => {
  const revenueData = snapshot.events
    .filter((event) => event.grossRevenue > 0 || event.totalOrders > 0)
    .slice(0, 6)
    .map((event) => ({
      name: compactTitle(event.event.title),
      revenue: event.grossRevenue,
      payout: Math.max(event.authorizedRevenue - event.platformFeeRevenue, 0),
    }));

  const orderFlowData = snapshot.events
    .filter((event) => event.totalOrders > 0)
    .slice(0, 6)
    .map((event) => ({
      name: compactTitle(event.event.title),
      approved: event.approvedOrders,
      underReview: event.underReviewOrders,
      cancelled: event.cancelledOrders,
    }));

  const readyForPayout = Math.max(snapshot.summary.authorizedRevenue - snapshot.summary.platformFeeRevenue, 0);

  const payoutMixData = [
    { name: "ready", value: readyForPayout, fill: "var(--color-ready)" },
    { name: "fee", value: snapshot.summary.platformFeeRevenue, fill: "var(--color-fee)" },
    { name: "refunded", value: snapshot.summary.refundedRevenue, fill: "var(--color-refunded)" },
    { name: "pending", value: snapshot.summary.pendingPlatformFeeRevenue, fill: "var(--color-pending)" },
  ].filter((entry) => entry.value > 0);

  const publicationData = [
    {
      name: "published",
      value: snapshot.events.filter((event) => event.publicationStatus === "published").length,
      fill: "var(--color-published)",
    },
    {
      name: "draft",
      value: snapshot.events.filter((event) => event.publicationStatus === "draft").length,
      fill: "var(--color-draft)",
    },
    {
      name: "archived",
      value: snapshot.events.filter((event) => event.publicationStatus === "archived").length,
      fill: "var(--color-archived)",
    },
    {
      name: "cancelledPublication",
      value: snapshot.events.filter((event) => event.publicationStatus === "cancelled").length,
      fill: "var(--color-cancelledPublication)",
    },
  ].filter((entry) => entry.value > 0);

  const occupancyData = snapshot.events
    .map((event) => {
      const totalSeats = eventMetaBySlug.get(event.event.slug)?.totalSeats ?? null;

      if (!totalSeats || totalSeats <= 0) {
        return null;
      }

      return {
        name: compactTitle(event.event.title),
        occupancy: Math.min((event.issuedTickets / totalSeats) * 100, 100),
      };
    })
    .filter((entry): entry is { name: string; occupancy: number } => Boolean(entry))
    .slice(0, 6);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Receita por evento</p>
            <h3 className="text-xl font-semibold text-foreground">Bruto vs repasse pronto</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Comparacao direta entre volume vendido e valor ja pronto para repasse ao produtor.
            </p>
          </div>

          {revenueData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={revenueData} barCategoryGap="18%">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={76} tickFormatter={(value) => `R$${Math.round(value / 1000)}k`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        formatCurrencyTooltip(Number(value), String(name === "revenue" ? "Receita bruta" : "Repasse pronto"))
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="payout" fill="var(--color-payout)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-5 text-sm leading-6 text-muted-foreground">
              Assim que os eventos tiverem vendas persistidas, esta comparacao passa a mostrar o peso financeiro de cada um.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pipeline operacional</p>
            <h3 className="text-xl font-semibold text-foreground">Pedidos aprovados, em revisao e cancelados</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Leitura executiva do risco operacional por evento, sem precisar abrir item por item.
            </p>
          </div>

          {orderFlowData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={orderFlowData} barCategoryGap="16%">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value, name) => formatNumberTooltip(Number(value), String(name))} />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="approved" stackId="orders" fill="var(--color-approved)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="underReview" stackId="orders" fill="var(--color-underReview)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cancelled" stackId="orders" fill="var(--color-cancelled)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-5 text-sm leading-6 text-muted-foreground">
              O pipeline ainda fica vazio quando nenhum evento saiu do zero comercial.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Composicao financeira</p>
            <h3 className="text-xl font-semibold text-foreground">Repasse, taxa, fila e reembolso</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Foto do caixa tratado: o que ja esta pronto para repasse e o que ainda consome margem operacional.
            </p>
          </div>

          {payoutMixData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value, name) => formatCurrencyTooltip(Number(value), String(name))} />
                  }
                />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                <Pie data={payoutMixData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={108} paddingAngle={3}>
                  {payoutMixData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-5 text-sm leading-6 text-muted-foreground">
              Quando entrar volume financeiro, esta composicao passa a mostrar taxa, reembolso e disponibilidade de repasse.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saude de publicacao</p>
            <h3 className="text-xl font-semibold text-foreground">Status editorial e ocupacao emitida</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Mistura entre presenca no catalogo e ocupacao de assentos para os eventos com mapa conhecido no seed local.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="min-h-72 rounded-2xl border border-border bg-background p-3">
              {publicationData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent formatter={(value, name) => formatNumberTooltip(Number(value), String(name), " evento(s)")} />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent nameKey="name" className="flex-wrap" />} />
                    <Pie data={publicationData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3}>
                      {publicationData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Sem status suficiente para o recorte.
                </div>
              )}
            </div>

            <div className="min-h-72 rounded-2xl border border-border bg-background p-3">
              {occupancyData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={occupancyData} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={96} tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => formatNumberTooltip(Number(value), String(name), "%")}
                        />
                      }
                    />
                    <Bar dataKey="occupancy" fill="var(--color-occupancy)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Os eventos sem capacidade mapeada ainda nao entram na leitura de ocupacao.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
