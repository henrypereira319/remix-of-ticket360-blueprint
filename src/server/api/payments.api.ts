import {
  getPaymentByOrder,
  getPaymentsByAccount,
  getStoredPayments,
  paymentStorageChannel,
  type PaymentRecord,
} from "@/server/payment.service";
import { hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";

export const paymentsApiChannels = hasConfiguredBackendUrl ? (["account.remote"] as const) : ([paymentStorageChannel] as const);

export const listPaymentsByAccount = async (accountId?: string | null) => {
  if (hasConfiguredBackendUrl && accountId) {
    try {
      return await requestBackendJson<PaymentRecord[]>(`/api/accounts/${accountId}/payments`);
    } catch (error) {
      console.warn("Falha ao carregar pagamentos remotos da conta, usando fallback local.", error);
    }
  }

  return getPaymentsByAccount(accountId);
};

export const listAllPayments = async (): Promise<PaymentRecord[]> => getStoredPayments();

export const getPaymentForOrder = async (orderId: string): Promise<PaymentRecord | null> => getPaymentByOrder(orderId) ?? null;
