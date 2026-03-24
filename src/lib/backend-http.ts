const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const configuredBaseUrl = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL ?? "");
const isVitestRuntime = Boolean(import.meta.env.VITEST);

export const hasConfiguredBackendUrl = configuredBaseUrl.length > 0 && !isVitestRuntime;

export const emitBackendMutation = (channel: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("eventhub:storage-mutation", {
      detail: {
        channel,
      },
    }),
  );
};

const joinUrl = (baseUrl: string, path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimTrailingSlash(baseUrl)}${normalizedPath}`;
};

export class BackendHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendHttpError";
    this.status = status;
  }
}

export const requestBackendJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!hasConfiguredBackendUrl) {
    throw new Error("Backend URL nao configurada.");
  }

  const response = await fetch(joinUrl(configuredBaseUrl, path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Falha HTTP ${response.status}.`;
    throw new BackendHttpError(message, response.status);
  }

  return body as T;
};
