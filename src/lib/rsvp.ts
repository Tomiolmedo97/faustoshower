import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";

export type RsvpRecord = {
  id: number;
  clientId: string;
  guestName: string;
  attending: boolean;
  partySize: number;
  updatedAt: string;
};

const rsvpInput = z.object({
  clientId: z.string().min(8).max(80),
  guestName: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre")
    .max(80)
    .regex(/^[\p{L}\p{M}\s.'-]+$/u, "Usá solo letras en el nombre"),
  attending: z.boolean(),
  partySize: z.number().int().min(0).max(12),
});

const clientIdInput = z.object({
  clientId: z.string().min(8).max(80),
});

function mapRow(row: {
  id: number;
  client_id: string;
  guest_name: string;
  attending: boolean;
  party_size: number;
  updated_at: string | Date;
}): RsvpRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    guestName: row.guest_name,
    attending: row.attending,
    partySize: row.party_size,
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : row.updated_at.toISOString(),
  };
}

export const getMyRsvp = createServerFn({ method: "POST" })
  .validator(clientIdInput)
  .handler(async ({ data }): Promise<RsvpRecord | null> => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      client_id: string;
      guest_name: string;
      attending: boolean;
      party_size: number;
      updated_at: string | Date;
    }>`
      select id, client_id, guest_name, attending, party_size, updated_at
      from rsvps
      where client_id = ${data.clientId}
      limit 1
    `;
    return rows[0] ? mapRow(rows[0]) : null;
  });

export const submitRsvp = createServerFn({ method: "POST" })
  .validator(rsvpInput)
  .handler(async ({ data }): Promise<RsvpRecord> => {
    const partySize = data.attending ? Math.max(1, data.partySize) : 0;
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      client_id: string;
      guest_name: string;
      attending: boolean;
      party_size: number;
      updated_at: string | Date;
    }>`
      insert into rsvps (client_id, guest_name, attending, party_size, updated_at)
      values (${data.clientId}, ${data.guestName}, ${data.attending}, ${partySize}, now())
      on conflict (client_id) do update set
        guest_name = excluded.guest_name,
        attending = excluded.attending,
        party_size = excluded.party_size,
        updated_at = now()
      returning id, client_id, guest_name, attending, party_size, updated_at
    `;
    const row = rows[0];
    if (!row) throw new Error("No se pudo guardar la confirmación");
    return mapRow(row);
  });

export const listRsvps = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    confirmed: RsvpRecord[];
    declined: RsvpRecord[];
    guestCount: number;
  }> => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      client_id: string;
      guest_name: string;
      attending: boolean;
      party_size: number;
      updated_at: string | Date;
    }>`
      select id, client_id, guest_name, attending, party_size, updated_at
      from rsvps
      order by attending desc, guest_name asc
    `;
    const records = rows.map(mapRow);
    const confirmed = records.filter((r) => r.attending);
    const declined = records.filter((r) => !r.attending);
    const guestCount = confirmed.reduce((sum, r) => sum + r.partySize, 0);
    return { confirmed, declined, guestCount };
  },
);
