const createStorage = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
};

export const readStorageJson = <T>(key: string, fallback: T, storage = createStorage()): T => {
  if (!storage) {
    return fallback;
  }

  try {
    const rawValue = storage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStorageJson = <T>(key: string, value: T, storage = createStorage()) => {
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
};

export const createPersistentId = (prefix: string) =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}_${crypto.randomUUID()}`
    : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const emitStorageMutation = (channel: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("eventhub:storage-mutation", { detail: { channel } }));
};

export const getBrowserStorage = () => createStorage();
