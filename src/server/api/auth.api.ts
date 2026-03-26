import { hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";
import type {
  AccountRecord,
  AccountSession,
  LoginAccountInput,
  RegisterAccountInput,
  UpdateAccountProfileInput,
} from "@/lib/auth";

interface AuthResponse {
  account: AccountRecord;
  session: AccountSession;
}

interface GoogleAuthInput {
  credential: string;
}

export const hasRemoteAuth = hasConfiguredBackendUrl;

export const registerAccountRemote = async (input: RegisterAccountInput) =>
  requestBackendJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const loginAccountRemote = async (input: LoginAccountInput) =>
  requestBackendJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const loginAccountWithGoogleRemote = async (input: GoogleAuthInput) =>
  requestBackendJson<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const logoutAccountRemote = async (accountId: string) =>
  requestBackendJson<{ ok: true }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({
      accountId,
    }),
  });

export const getAccountProfileRemote = async (accountId: string) =>
  requestBackendJson<AccountRecord>(`/api/accounts/${accountId}/profile`);

export const updateAccountProfileRemote = async (accountId: string, input: UpdateAccountProfileInput) =>
  requestBackendJson<AccountRecord>(`/api/accounts/${accountId}/profile`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
