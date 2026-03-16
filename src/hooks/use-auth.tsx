import { createContext, useContext, useState, type ReactNode } from "react";
import type { AccountRecord, LoginAccountInput, RegisterAccountInput, UpdateAccountProfileInput } from "@/lib/auth";
import {
  getCurrentAccount,
  getStoredAccounts,
  getStoredSession,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateAccountProfile,
} from "@/lib/auth";

interface AuthContextValue {
  accounts: AccountRecord[];
  currentAccount: AccountRecord | null;
  isAuthenticated: boolean;
  register: (input: RegisterAccountInput) => AccountRecord;
  login: (input: LoginAccountInput) => AccountRecord;
  logout: () => void;
  updateProfile: (input: UpdateAccountProfileInput) => AccountRecord;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getSnapshot = () => ({
  accounts: getStoredAccounts(),
  currentAccount: getCurrentAccount(),
  session: getStoredSession(),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [snapshot, setSnapshot] = useState(getSnapshot);

  const syncSnapshot = () => setSnapshot(getSnapshot());

  const value: AuthContextValue = {
    accounts: snapshot.accounts,
    currentAccount: snapshot.currentAccount,
    isAuthenticated: Boolean(snapshot.session && snapshot.currentAccount),
    register: (input) => {
      const result = registerAccount(input);
      syncSnapshot();
      return result.account;
    },
    login: (input) => {
      const result = loginAccount(input);
      syncSnapshot();
      return result.account;
    },
    logout: () => {
      logoutAccount();
      syncSnapshot();
    },
    updateProfile: (input) => {
      if (!snapshot.currentAccount) {
        throw new Error("Nenhuma conta autenticada.");
      }

      const updatedAccount = updateAccountProfile(snapshot.currentAccount.id, input);
      syncSnapshot();
      return updatedAccount;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
