import { Landmark, ReceiptText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatDocument = (value: string) => {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  return value?.trim() || "Nao informado";
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const formatCurrency = (value: number) => currencyFormatter.format(Math.max(value, 0));

const payoutRows = (input: {
  fullName: string;
  document: string;
  authorizedRevenue: number;
  platformFeeRevenue: number;
}) => {
  const valueToReceive = roundCurrency(input.authorizedRevenue - input.platformFeeRevenue);

  return [
    { label: "Codigo da solicitacao", value: "Aguardando solicitacao" },
    { label: "Data da solicitacao", value: "Nao definida" },
    { label: "Data do repasse", value: "Nao definida" },
    { label: "Tipo de repasse", value: "Produtor" },
    { label: "Valor solicitado", value: formatCurrency(valueToReceive) },
    { label: "Taxa de operacao", value: formatCurrency(input.platformFeeRevenue) },
    { label: "Juros", value: formatCurrency(0) },
    { label: "Valor a receber", value: formatCurrency(valueToReceive) },
    { label: "Nome", value: input.fullName.trim() || "Nao informado" },
    { label: "CPF", value: formatDocument(input.document) },
    { label: "Agencia", value: "Nao informada" },
    { label: "Conta", value: "Nao informada" },
  ];
};

export const OrganizerPayoutInfoCard = ({
  fullName,
  document,
  authorizedRevenue,
  platformFeeRevenue,
  refundedRevenue,
}: {
  fullName: string;
  document: string;
  authorizedRevenue: number;
  platformFeeRevenue: number;
  refundedRevenue: number;
}) => {
  const rows = payoutRows({
    fullName,
    document,
    authorizedRevenue,
    platformFeeRevenue,
  });

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <ReceiptText className="h-4 w-4 text-primary" />
            Informacoes do repasse
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            O painel passa a reservar um bloco proprio para o repasse. Campos sem preenchimento ainda dependem do fluxo
            formal de solicitacao e do cadastro bancario do produtor.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-start justify-between gap-4 px-4 py-3 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="text-sm font-medium text-foreground">{row.label}</span>
              <span className="text-right text-sm text-muted-foreground">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2 text-foreground">
            <Landmark className="h-4 w-4 text-primary" />
            Extrato atual
          </div>
          <p className="mt-2">Autorizado no momento: {formatCurrency(authorizedRevenue)}</p>
          <p className="mt-1">Taxa da etiqueteira/plataforma: {formatCurrency(platformFeeRevenue)}</p>
          <p className="mt-1">Reembolsado: {formatCurrency(refundedRevenue)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
