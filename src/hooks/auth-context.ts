import { createContext } from "react";
import type { AccountRecord, LoginAccountInput, RegisterAccountInput, UpdateAccountProfileInput } from "@/lib/auth";

export interface AuthContextValue {
  accounts: AccountRecord[];
  currentAccount: AccountRecord | null;
  isAuthenticated: boolean;
  register: (input: RegisterAccountInput) => Promise<AccountRecord>;
  login: (input: LoginAccountInput) => Promise<AccountRecord>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateAccountProfileInput) => Promise<AccountRecord>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
