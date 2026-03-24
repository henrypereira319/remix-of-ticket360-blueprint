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
import { emitBackendMutation, hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";
import { denyOrderFromBackoffice } from "@/server/operations.service";

const remoteOrdersChannel = "orders.remote";

export const ordersApiChannels = hasConfiguredBackendUrl ? ([remoteOrdersChannel] as const) : ([checkoutStorageChannel] as const);

const notifyRemoteOrderMutation = () => {
  emitBackendMutation(remoteOrdersChannel);
  emitBackendMutation("inventory.remote");
  emitBackendMutation("backoffice.remote");
  emitBackendMutation("account.remote");
};

export const createOrder = async (input: CreateCheckoutOrderInput) => {
  if (hasConfiguredBackendUrl) {
    try {
      const order = await requestBackendJson<CheckoutOrderRecord>("/api/orders", {
        method: "POST",
        body: JSON.stringify(input),
      });
      notifyRemoteOrderMutation();
      return order;
    } catch (error) {
      console.warn("Falha ao criar pedido remoto, usando checkout local.", error);
    }
  }

  return createCheckoutOrder(input);
};

export const listOrdersByAccount = async (accountId?: string | null) => {
  if (hasConfiguredBackendUrl && accountId) {
    try {
      return await requestBackendJson<CheckoutOrderRecord[]>(`/api/accounts/${accountId}/orders`);
    } catch (error) {
      console.warn("Falha ao carregar pedidos remotos da conta, usando fallback local.", error);
    }
  }

  return getOrdersByAccount(accountId);
};

export const listAllOrders = async (): Promise<CheckoutOrderRecord[]> => getStoredOrders();

export const getOrderById = async (orderId: string): Promise<CheckoutOrderRecord | null> =>
  getStoredOrders().find((order) => order.id === orderId) ?? null;

export const settleOrder = async (orderId: string) => settleOrderPayment(orderId);

export const approveOrder = async (orderId: string) => approveCheckoutOrder(orderId);

export const denyOrder = async (orderId: string) => denyOrderFromBackoffice(orderId);

export const cancelOrder = async (orderId: string) => cancelCheckoutOrder(orderId);
