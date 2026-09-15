import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";

export type LetterRecord = {
  id: number;
  clientId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

const letterInput = z.object({
  clientId: z.string().min(8).max(80),
  authorName: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre")
    .max(80)
    .regex(/^[\p{L}\p{M}\s.'-]+$/u, "Usá solo letras en el nombre"),
  body: z
    .string()
    .trim()
    .min(8, "Escribí al menos un renglón")
    .max(600, "Máximo 600 caracteres"),
});

const clientIdInput = z.object({
  clientId: z.string().min(8).max(80),
});

function mapRow(row: {
  id: number;
  client_id: string;
  author_name: string;
  body: string;
  created_at: string | Date;
}): LetterRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    authorName: row.author_name,
    body: row.body,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
  };
}

export const getMyLetter = createServerFn({ method: "POST" })
  .validator(clientIdInput)
  .handler(async ({ data }): Promise<LetterRecord | null> => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      client_id: string;
      author_name: string;
      body: string;
      created_at: string | Date;
    }>`
      select id, client_id, author_name, body, created_at
      from letters
      where client_id = ${data.clientId}
      limit 1
    `;
    return rows[0] ? mapRow(rows[0]) : null;
  });

export const submitLetter = createServerFn({ method: "POST" })
  .validator(letterInput)
  .handler(async ({ data }): Promise<LetterRecord> => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      client_id: string;
      author_name: string;
      body: string;
      created_at: string | Date;
    }>`
      insert into letters (client_id, author_name, body, updated_at)
      values (${data.clientId}, ${data.authorName}, ${data.body}, now())
      on conflict (client_id) do update set
        author_name = excluded.author_name,
        body = excluded.body,
        updated_at = now()
      returning id, client_id, author_name, body, created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("No se pudo guardar la carta");
    return mapRow(row);
  });

export const listLetters = createServerFn({ method: "GET" }).handler(
  async (): Promise<LetterRecord[]> => {
    const { assertHost } = await import("./host.server");
    assertHost();
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      client_id: string;
      author_name: string;
      body: string;
      created_at: string | Date;
    }>`
      select id, client_id, author_name, body, created_at
      from letters
      order by created_at desc
    `;
    return rows.map(mapRow);
  },
);
