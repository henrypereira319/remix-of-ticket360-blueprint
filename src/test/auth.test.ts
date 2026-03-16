import { beforeEach, describe, expect, it } from "vitest";
import {
  createDemoPasswordHash,
  getCurrentAccount,
  getStoredSession,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateAccountProfile,
} from "@/lib/auth";

describe("account management", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("registra uma conta e cria sessao local", () => {
    const result = registerAccount({
      fullName: "Marina Costa",
      email: "marina@example.com",
      document: "12345678901",
      phone: "11999999999",
      city: "Sao Paulo / SP",
      password: "senha123",
    });

    expect(result.account.email).toBe("marina@example.com");
    expect(result.account.passwordHash).toBe(createDemoPasswordHash("marina@example.com", "senha123"));
    expect(getStoredSession()?.accountId).toBe(result.account.id);
    expect(getCurrentAccount()?.fullName).toBe("Marina Costa");
  });

  it("faz login e atualiza o perfil da conta", () => {
    const registered = registerAccount({
      fullName: "Joao Ribeiro",
      email: "joao@example.com",
      document: "98765432100",
      phone: "21988888888",
      city: "Rio de Janeiro / RJ",
      password: "senha321",
    });

    logoutAccount();

    const login = loginAccount({
      email: "joao@example.com",
      password: "senha321",
    });

    expect(login.account.id).toBe(registered.account.id);

    const updatedAccount = updateAccountProfile(login.account.id, {
      fullName: "Joao Ribeiro Filho",
      email: "joao@example.com",
      document: "98765432100",
      phone: "21988887777",
      city: "Niteroi / RJ",
    });

    expect(updatedAccount.fullName).toBe("Joao Ribeiro Filho");
    expect(updatedAccount.city).toBe("Niteroi / RJ");
    expect(updatedAccount.activity[0].type).toBe("profile_updated");
  });
});
