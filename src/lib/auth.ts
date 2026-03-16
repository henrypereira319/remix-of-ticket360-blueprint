export interface AccountActivity {
  id: string;
  type: "registered" | "login" | "profile_updated" | "logout";
  message: string;
  createdAt: string;
}

export interface AccountRecord {
  id: string;
  fullName: string;
  email: string;
  document: string;
  phone: string;
  city: string;
  provider: "password" | "google";
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  activity: AccountActivity[];
}

export interface AccountSession {
  accountId: string;
  provider: "password" | "google";
  email: string;
  fullName: string;
  signedInAt: string;
}

export interface RegisterAccountInput {
  fullName: string;
  email: string;
  document: string;
  phone: string;
  city: string;
  password: string;
}

export interface LoginAccountInput {
  email: string;
  password: string;
}

export interface UpdateAccountProfileInput {
  fullName: string;
  email: string;
  document: string;
  phone: string;
  city: string;
}

const ACCOUNTS_STORAGE_KEY = "ticket360.accounts";
const SESSION_STORAGE_KEY = "ticket360.session";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createStorage = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
};

const readJson = <T>(key: string, fallback: T, storage = createStorage()): T => {
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

const writeJson = <T>(key: string, value: T, storage = createStorage()) => {
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
};

const removeValue = (key: string, storage = createStorage()) => {
  if (!storage) {
    return;
  }

  storage.removeItem(key);
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createActivity = (type: AccountActivity["type"], message: string): AccountActivity => ({
  id: createId(),
  type,
  message,
  createdAt: new Date().toISOString(),
});

export const createDemoPasswordHash = (email: string, password: string) => {
  const input = `${normalizeEmail(email)}:${password}`;
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

export const getStoredAccounts = (storage = createStorage()) =>
  readJson<AccountRecord[]>(ACCOUNTS_STORAGE_KEY, [], storage);

export const getStoredSession = (storage = createStorage()) =>
  readJson<AccountSession | null>(SESSION_STORAGE_KEY, null, storage);

export const getCurrentAccount = (storage = createStorage()) => {
  const session = getStoredSession(storage);

  if (!session) {
    return null;
  }

  return getStoredAccounts(storage).find((account) => account.id === session.accountId) ?? null;
};

export const registerAccount = (input: RegisterAccountInput, storage = createStorage()) => {
  const accounts = getStoredAccounts(storage);
  const normalizedEmail = normalizeEmail(input.email);

  if (accounts.some((account) => normalizeEmail(account.email) === normalizedEmail)) {
    throw new Error("Ja existe uma conta cadastrada com este email.");
  }

  const timestamp = new Date().toISOString();
  const account: AccountRecord = {
    id: createId(),
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    document: input.document.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    provider: "password",
    passwordHash: createDemoPasswordHash(normalizedEmail, input.password),
    createdAt: timestamp,
    updatedAt: timestamp,
    activity: [createActivity("registered", "Conta criada com cadastro por email e senha.")],
  };

  const session: AccountSession = {
    accountId: account.id,
    provider: account.provider,
    email: account.email,
    fullName: account.fullName,
    signedInAt: timestamp,
  };

  writeJson(ACCOUNTS_STORAGE_KEY, [...accounts, account], storage);
  writeJson(SESSION_STORAGE_KEY, session, storage);

  return { account, session };
};

export const loginAccount = (input: LoginAccountInput, storage = createStorage()) => {
  const accounts = getStoredAccounts(storage);
  const normalizedEmail = normalizeEmail(input.email);
  const passwordHash = createDemoPasswordHash(normalizedEmail, input.password);
  const accountIndex = accounts.findIndex(
    (account) => normalizeEmail(account.email) === normalizedEmail && account.passwordHash === passwordHash,
  );

  if (accountIndex === -1) {
    throw new Error("Email ou senha invalidos.");
  }

  const updatedAccount: AccountRecord = {
    ...accounts[accountIndex],
    updatedAt: new Date().toISOString(),
    activity: [createActivity("login", "Login realizado com email e senha."), ...accounts[accountIndex].activity],
  };

  const updatedAccounts = [...accounts];
  updatedAccounts[accountIndex] = updatedAccount;

  const session: AccountSession = {
    accountId: updatedAccount.id,
    provider: updatedAccount.provider,
    email: updatedAccount.email,
    fullName: updatedAccount.fullName,
    signedInAt: new Date().toISOString(),
  };

  writeJson(ACCOUNTS_STORAGE_KEY, updatedAccounts, storage);
  writeJson(SESSION_STORAGE_KEY, session, storage);

  return { account: updatedAccount, session };
};

export const updateAccountProfile = (
  accountId: string,
  input: UpdateAccountProfileInput,
  storage = createStorage(),
) => {
  const accounts = getStoredAccounts(storage);
  const normalizedEmail = normalizeEmail(input.email);
  const accountIndex = accounts.findIndex((account) => account.id === accountId);

  if (accountIndex === -1) {
    throw new Error("Conta nao encontrada.");
  }

  const duplicatedEmail = accounts.some(
    (account) => account.id !== accountId && normalizeEmail(account.email) === normalizedEmail,
  );

  if (duplicatedEmail) {
    throw new Error("Este email ja esta em uso por outra conta.");
  }

  const updatedAccount: AccountRecord = {
    ...accounts[accountIndex],
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    document: input.document.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    updatedAt: new Date().toISOString(),
    activity: [createActivity("profile_updated", "Dados cadastrais atualizados."), ...accounts[accountIndex].activity],
  };

  const updatedAccounts = [...accounts];
  updatedAccounts[accountIndex] = updatedAccount;

  const currentSession = getStoredSession(storage);

  writeJson(ACCOUNTS_STORAGE_KEY, updatedAccounts, storage);

  if (currentSession?.accountId === updatedAccount.id) {
    writeJson(
      SESSION_STORAGE_KEY,
      {
        ...currentSession,
        email: updatedAccount.email,
        fullName: updatedAccount.fullName,
      },
      storage,
    );
  }

  return updatedAccount;
};

export const logoutAccount = (storage = createStorage()) => {
  const session = getStoredSession(storage);

  if (session) {
    const accounts = getStoredAccounts(storage);
    const accountIndex = accounts.findIndex((account) => account.id === session.accountId);

    if (accountIndex !== -1) {
      const updatedAccounts = [...accounts];
      updatedAccounts[accountIndex] = {
        ...accounts[accountIndex],
        updatedAt: new Date().toISOString(),
        activity: [createActivity("logout", "Sessao encerrada manualmente."), ...accounts[accountIndex].activity],
      };
      writeJson(ACCOUNTS_STORAGE_KEY, updatedAccounts, storage);
    }
  }

  removeValue(SESSION_STORAGE_KEY, storage);
};
