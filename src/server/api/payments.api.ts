import {
  getPaymentByOrder,
  getPaymentsByAccount,
  getStoredPayments,
  paymentStorageChannel,
  type PaymentRecord,
} from "@/server/payment.service";

export const paymentsApiChannels = [paymentStorageChannel] as const;

export const listPaymentsByAccount = async (accountId?: string | null) => getPaymentsByAccount(accountId);

export const listAllPayments = async (): Promise<PaymentRecord[]> => getStoredPayments();

export const getPaymentForOrder = async (orderId: string): Promise<PaymentRecord | null> => getPaymentByOrder(orderId) ?? null;
