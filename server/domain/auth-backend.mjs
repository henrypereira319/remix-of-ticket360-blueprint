import crypto from "node:crypto";
import { withDbClient } from "../db/client.mjs";
import { appendAuditLog, asObject, asNullableText } from "./helpers.mjs";

const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

const hashPassword = (password, salt) =>
  crypto.scryptSync(String(password ?? ""), salt, 64, {
    maxmem: 128 * 1024 * 1024,
  }).toString("hex");

const buildSession = (account) => ({
  accountId: account.id,
  provider: account.provider,
  email: account.email,
  fullName: account.fullName,
  signedInAt: new Date().toISOString(),
});

const mapActivityRow = (row) => ({
  id: row.id,
  type: row.activity_type,
  message: row.message,
  createdAt: row.created_at,
});

const mapAccountRow = (row, activityRows = []) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  document: row.document ?? "",
  phone: row.phone ?? "",
  city: row.city ?? "",
  provider: row.provider,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  activity: activityRows.map(mapActivityRow),
});

const readAccountWithActivity = async (client, accountId) => {
  const accountResult = await client.query("select * from public.customer_accounts where id = $1 limit 1", [accountId]);
  const accountRow = accountResult.rows[0];

  if (!accountRow) {
    throw new Error("Conta nao encontrada no backend.");
  }

  const activityResult = await client.query(
    `
      select *
      from public.customer_account_activity_log
      where account_id = $1
      order by created_at desc
      limit 20
    `,
    [accountId],
  );

  return mapAccountRow(accountRow, activityResult.rows);
};

const appendAccountActivity = async (client, { accountId, type, message, metadata = {} }) => {
  await client.query(
    `
      insert into public.customer_account_activity_log (account_id, activity_type, message, metadata)
      values ($1, $2, $3, $4::jsonb)
    `,
    [accountId, type, message, JSON.stringify(asObject(metadata))],
  );
};

export const registerCustomerAccountInDb = async (input, actor = {}) =>
  withDbClient(async (client) => {
    const email = normalizeEmail(input.email);
    const duplicateResult = await client.query("select id from public.customer_accounts where email = $1 limit 1", [email]);

    if (duplicateResult.rows[0]) {
      throw new Error("Ja existe uma conta cadastrada com este email.");
    }

    const passwordSalt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(input.password, passwordSalt);
    const createdResult = await client.query(
      `
        insert into public.customer_accounts (
          full_name,
          email,
          document,
          phone,
          city,
          provider,
          password_salt,
          password_hash,
          metadata
        )
        values ($1, $2, $3, $4, $5, 'password', $6, $7, $8::jsonb)
        returning *
      `,
      [
        String(input.fullName ?? "").trim(),
        email,
        asNullableText(input.document),
        asNullableText(input.phone),
        asNullableText(input.city),
        passwordSalt,
        passwordHash,
        JSON.stringify({
          source: "http-bff",
        }),
      ],
    );

    const account = createdResult.rows[0];
    await appendAccountActivity(client, {
      accountId: account.id,
      type: "registered",
      message: "Conta criada com email e senha no backend.",
      metadata: {
        provider: "password",
      },
    });
    await appendAuditLog(client, {
      actorType: actor.actorType ?? "system",
      actorId: actor.actorId ?? null,
      actorEmail: actor.actorEmail ?? email,
      action: "customer.account.registered",
      targetTable: "customer_accounts",
      targetId: account.id,
      context: {
        email,
      },
    });

    const hydratedAccount = await readAccountWithActivity(client, account.id);
    return {
      account: hydratedAccount,
      session: buildSession(hydratedAccount),
    };
  });

export const loginCustomerAccountInDb = async (input, actor = {}) =>
  withDbClient(async (client) => {
    const email = normalizeEmail(input.email);
    const accountResult = await client.query("select * from public.customer_accounts where email = $1 limit 1", [email]);
    const account = accountResult.rows[0];

    if (!account || !account.password_salt || !account.password_hash) {
      throw new Error("Email ou senha invalidos.");
    }

    const attemptedHash = hashPassword(input.password, account.password_salt);

    if (!crypto.timingSafeEqual(Buffer.from(attemptedHash, "hex"), Buffer.from(account.password_hash, "hex"))) {
      throw new Error("Email ou senha invalidos.");
    }

    if (!account.is_active) {
      throw new Error("Esta conta esta inativa.");
    }

    await client.query("update public.customer_accounts set updated_at = timezone('utc'::text, now()) where id = $1", [account.id]);
    await appendAccountActivity(client, {
      accountId: account.id,
      type: "login",
      message: "Login realizado com email e senha no backend.",
      metadata: {
        actorType: actor.actorType ?? "account",
      },
    });
    await appendAuditLog(client, {
      actorType: "account",
      actorId: account.id,
      actorEmail: email,
      action: "customer.account.login",
      targetTable: "customer_accounts",
      targetId: account.id,
      context: {
        actorType: actor.actorType ?? "account",
      },
    });

    const hydratedAccount = await readAccountWithActivity(client, account.id);
    return {
      account: hydratedAccount,
      session: buildSession(hydratedAccount),
    };
  });

export const getCustomerAccountByIdFromDb = async (accountId) =>
  withDbClient(async (client) => readAccountWithActivity(client, accountId));

export const updateCustomerAccountProfileInDb = async (accountId, input, actor = {}) =>
  withDbClient(async (client) => {
    const email = normalizeEmail(input.email);
    const duplicateResult = await client.query(
      "select id from public.customer_accounts where email = $1 and id <> $2 limit 1",
      [email, accountId],
    );

    if (duplicateResult.rows[0]) {
      throw new Error("Este email ja esta em uso por outra conta.");
    }

    const updateResult = await client.query(
      `
        update public.customer_accounts
        set
          full_name = $2,
          email = $3,
          document = $4,
          phone = $5,
          city = $6
        where id = $1
        returning *
      `,
      [
        accountId,
        String(input.fullName ?? "").trim(),
        email,
        asNullableText(input.document),
        asNullableText(input.phone),
        asNullableText(input.city),
      ],
    );
    const account = updateResult.rows[0];

    if (!account) {
      throw new Error("Conta nao encontrada no backend.");
    }

    await appendAccountActivity(client, {
      accountId,
      type: "profile_updated",
      message: "Dados cadastrais atualizados no backend.",
      metadata: {
        actorType: actor.actorType ?? "account",
      },
    });
    await appendAuditLog(client, {
      actorType: actor.actorType ?? "account",
      actorId: actor.actorId ?? accountId,
      actorEmail: actor.actorEmail ?? email,
      action: "customer.account.profile_updated",
      targetTable: "customer_accounts",
      targetId: accountId,
      context: {
        city: account.city,
      },
    });

    return readAccountWithActivity(client, accountId);
  });

export const appendCustomerAccountLogoutInDb = async (accountId, actor = {}) =>
  withDbClient(async (client) => {
    const accountResult = await client.query("select * from public.customer_accounts where id = $1 limit 1", [accountId]);
    const account = accountResult.rows[0];

    if (!account) {
      return {
        ok: true,
      };
    }

    await client.query("update public.customer_accounts set updated_at = timezone('utc'::text, now()) where id = $1", [accountId]);
    await appendAccountActivity(client, {
      accountId,
      type: "logout",
      message: "Sessao encerrada a partir da conta.",
      metadata: {
        actorType: actor.actorType ?? "account",
      },
    });
    await appendAuditLog(client, {
      actorType: actor.actorType ?? "account",
      actorId: actor.actorId ?? accountId,
      actorEmail: actor.actorEmail ?? account.email,
      action: "customer.account.logout",
      targetTable: "customer_accounts",
      targetId: accountId,
      context: {},
    });

    return {
      ok: true,
    };
  });
