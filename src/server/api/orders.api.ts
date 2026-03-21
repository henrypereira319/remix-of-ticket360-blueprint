import {
  approveCheckoutOrder,
  cancelCheckoutOrder,
  checkoutStorageChannel,
  createCheckoutOrder,
  getOrdersByAccount,
  getStoredOrders,
  settleOrderPayment,
  type CheckoutOrderRecord,
  type CreateCheckoutOrderInput,
} from "@/server/checkout.service";
import { denyOrderFromBackoffice } from "@/server/operations.service";

export const ordersApiChannels = [checkoutStorageChannel] as const;

export const createOrder = async (input: CreateCheckoutOrderInput) => createCheckoutOrder(input);

export const listOrdersByAccount = async (accountId?: string | null) => getOrdersByAccount(accountId);

export const listAllOrders = async (): Promise<CheckoutOrderRecord[]> => getStoredOrders();

export const getOrderById = async (orderId: string): Promise<CheckoutOrderRecord | null> =>
  getStoredOrders().find((order) => order.id === orderId) ?? null;

export const settleOrder = async (orderId: string) => settleOrderPayment(orderId);

export const approveOrder = async (orderId: string) => approveCheckoutOrder(orderId);

export const denyOrder = async (orderId: string) => denyOrderFromBackoffice(orderId);

export const cancelOrder = async (orderId: string) => cancelCheckoutOrder(orderId);
