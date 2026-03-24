import crypto from "node:crypto";
import { appendAuditLog, asNullableText, asObject, runWithMaybeClient, runWithMaybeTransaction } from "./helpers.mjs";

const mapSupportCaseRow = (row) => ({
  id: row.id,
  accountId: row.account_id,
  orderId: row.order_id,
  orderReference: row.order_reference ?? null,
  eventSlug: row.event_slug ?? null,
  category: row.category,
  status: row.status,
  subject: row.subject,
  message: row.message,
  resolutionSummary: row.resolution_summary,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildSupportCaseSelectSql = () => `
  select
    support.*,
    orders.reference as order_reference,
    events.slug as event_slug
  from public.support_cases support
  left join public.orders orders on orders.id = support.order_id
  left join public.events events on events.id = orders.event_id
`;

export const listSupportCasesByLocalAccountId = async (accountId, options = {}) =>
  runWithMaybeClient(options.client, async (client) => {
    if (!accountId) {
      return [];
    }

    const result = await client.query(
      `
        ${buildSupportCaseSelectSql()}
        where support.account_id::text = $1
          or support.metadata ->> 'localAccountId' = $1
        order by support.created_at desc
      `,
      [accountId],
    );

    return result.rows.map(mapSupportCaseRow);
  });

export const createSupportCaseInDb = async (
  { accountId = null, orderId = null, category, subject, message, metadata = {} },
  actor = {},
  options = {},
) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const result = await client.query(
      `
        insert into public.support_cases (
          id, account_id, order_id, category, status, subject, message, metadata
        )
        values ($1, $2, $3, $4, 'open', $5, $6, $7::jsonb)
        returning *
      `,
      [
        crypto.randomUUID(),
        accountId,
        orderId,
        category,
        subject.trim(),
        message.trim(),
        JSON.stringify(asObject(metadata)),
      ],
    );

    const supportCase = mapSupportCaseRow(result.rows[0]);

    await appendAuditLog(client, {
      actorType: actor.actorType ?? "account",
      actorId: actor.actorId ?? null,
      actorEmail: actor.actorEmail ?? null,
      action: "support.case.created",
      targetTable: "support_cases",
      targetId: supportCase.id,
      context: {
        category: supportCase.category,
        localAccountId: asNullableText(metadata.localAccountId),
        orderId: supportCase.orderId,
      },
    });

    const hydratedResult = await client.query(
      `
        ${buildSupportCaseSelectSql()}
        where support.id = $1
        limit 1
      `,
      [supportCase.id],
    );

    return mapSupportCaseRow(hydratedResult.rows[0]);
  });
