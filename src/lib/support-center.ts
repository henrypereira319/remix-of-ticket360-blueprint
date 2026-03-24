import type { SupportCaseCategory, SupportCaseStatus } from "@/server/support.service";

export const supportCategoryLabels: Record<SupportCaseCategory, string> = {
  order: "Pedido",
  payment: "Pagamento",
  ticket: "Ingresso",
  refund: "Reembolso",
  access: "Acesso",
};

export const supportStatusMeta: Record<
  SupportCaseStatus,
  {
    label: string;
    tone: "neutral" | "warning" | "success";
  }
> = {
  open: {
    label: "Aberto",
    tone: "warning",
  },
  investigating: {
    label: "Em analise",
    tone: "neutral",
  },
  resolved: {
    label: "Resolvido",
    tone: "success",
  },
};

export const supportHelpArticles = [
  {
    id: "payment-review",
    title: "Pedido em revisao manual",
    summary: "Entenda por que um pedido corporativo ou manual ainda nao virou ingresso emitido.",
    steps: [
      "Confira o status do pedido e do pagamento na area da conta.",
      "Se o pedido estiver em revisao, aguarde a fila operacional ou abra um caso citando a referencia.",
      "Nao refaca a compra antes de confirmar se o hold original ja foi liberado.",
    ],
  },
  {
    id: "ticket-wallet",
    title: "Ingresso ainda nao apareceu na wallet",
    summary: "Roteiro rapido para validar emissao, cancelamento e vinculacao do pedido.",
    steps: [
      "Abra o detalhe do pedido e verifique se existe ticket emitido para cada assento.",
      "Se houver cancelamento ou reembolso, o ticket pode sair da carteira automaticamente.",
      "Quando faltar emissao para pedido aprovado, abra um caso com o pedido e o assento afetado.",
    ],
  },
  {
    id: "refund-help",
    title: "Cancelamento e reembolso",
    summary: "Como abrir uma solicitacao clara quando o fluxo de pos-compra saiu do esperado.",
    steps: [
      "Tenha em maos a referencia do pedido, forma de pagamento e motivo do cancelamento.",
      "Explique se o problema ocorreu antes ou depois da emissao do ingresso.",
      "Se houver urgencia operacional, cite o evento e o horario da sessao no chamado.",
    ],
  },
] as const;
