import { useEffect, useState, type ReactNode } from "react";
import {
  clearStoredSession,
  getCurrentAccount,
  getStoredAccounts,
  getStoredSession,
  loginAccount,
  loginWithGoogleAccount,
  logoutAccount,
  parseGoogleIdentityCredential,
  persistRemoteAuthSnapshot,
  replaceStoredAccount,
  registerAccount,
  setStoredSession,
  updateAccountProfile,
} from "@/lib/auth";
import {
  getAccountProfileRemote,
  hasRemoteAuth,
  loginAccountRemote,
  loginAccountWithGoogleRemote,
  logoutAccountRemote,
  registerAccountRemote,
  updateAccountProfileRemote,
} from "@/server/api/auth.api";
import { AuthContext, type AuthContextValue } from "@/hooks/auth-context";

const getSnapshot = () => ({
  accounts: getStoredAccounts(),
  currentAccount: getCurrentAccount(),
  session: getStoredSession(),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [snapshot, setSnapshot] = useState(getSnapshot);
  const currentAccountId = snapshot.currentAccount?.id ?? null;

  const syncSnapshot = () => setSnapshot(getSnapshot());

  useEffect(() => {
    if (!hasRemoteAuth || !currentAccountId) {
      return;
    }

    let cancelled = false;

    const hydrateCurrentAccount = async () => {
      try {
        const remoteAccount = await getAccountProfileRemote(currentAccountId);

        if (cancelled) {
          return;
        }

        replaceStoredAccount(remoteAccount);
        setSnapshot(getSnapshot());
      } catch (error) {
        console.warn("Falha ao hidratar conta autenticada a partir do backend remoto.", error);
      }
    };

    void hydrateCurrentAccount();

    return () => {
      cancelled = true;
    };
  }, [currentAccountId]);

  const value: AuthContextValue = {
    accounts: snapshot.accounts,
    currentAccount: snapshot.currentAccount,
    isAuthenticated: Boolean(snapshot.session && snapshot.currentAccount),
    register: async (input) => {
      let result;

      if (hasRemoteAuth) {
        try {
          result = await registerAccountRemote(input);
          persistRemoteAuthSnapshot(result.account, result.session);
          syncSnapshot();
          return result.account;
        } catch (error) {
          console.warn("Falha ao registrar conta no backend remoto, usando fallback local.", error);
        }
      }

      result = registerAccount(input);
      syncSnapshot();
      return result.account;
    },
    login: async (input) => {
      let result;

      if (hasRemoteAuth) {
        try {
          result = await loginAccountRemote(input);
          persistRemoteAuthSnapshot(result.account, result.session);
          syncSnapshot();
          return result.account;
        } catch (error) {
          console.warn("Falha ao autenticar conta no backend remoto, usando fallback local.", error);
        }
      }

      result = loginAccount(input);
      syncSnapshot();
      return result.account;
    },
    loginWithGoogle: async (credential) => {
      let result;

      if (hasRemoteAuth) {
        try {
          result = await loginAccountWithGoogleRemote({ credential });
          persistRemoteAuthSnapshot(result.account, result.session);
          syncSnapshot();
          return result.account;
        } catch (error) {
          console.warn("Falha ao autenticar com Google no backend remoto, usando fallback local.", error);
        }
      }

      const profile = parseGoogleIdentityCredential(credential);
      result = loginWithGoogleAccount(profile);
      syncSnapshot();
      return result.account;
    },
    logout: async () => {
      if (hasRemoteAuth && snapshot.currentAccount) {
        try {
          await logoutAccountRemote(snapshot.currentAccount.id);
        } catch (error) {
          console.warn("Falha ao registrar logout no backend remoto, limpando sessao local mesmo assim.", error);
        }

        clearStoredSession();
        setStoredSession(null);
        syncSnapshot();
        return;
      }

      logoutAccount();
      syncSnapshot();
    },
    updateProfile: async (input) => {
      if (!snapshot.currentAccount) {
        throw new Error("Nenhuma conta autenticada.");
      }

      if (hasRemoteAuth) {
        try {
          const updatedAccount = await updateAccountProfileRemote(snapshot.currentAccount.id, input);
          replaceStoredAccount(updatedAccount);

          if (snapshot.session) {
            setStoredSession({
              ...snapshot.session,
              email: updatedAccount.email,
              fullName: updatedAccount.fullName,
            });
          }

          syncSnapshot();
          return updatedAccount;
        } catch (error) {
          console.warn("Falha ao atualizar perfil no backend remoto, usando fallback local.", error);
        }
      }

      const updatedAccount = updateAccountProfile(snapshot.currentAccount.id, input);
      syncSnapshot();
      return updatedAccount;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
