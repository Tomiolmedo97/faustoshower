import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export const getMyRsvp = createServerFn({ method: "POST" })
  .validator(clientIdInput)
  .handler(async ({ data }): Promise<RsvpRecord | null> => {
    const { findRsvp } = await import("./album-store.server");
    return findRsvp(data.clientId);
  });

export const submitRsvp = createServerFn({ method: "POST" })
  .validator(rsvpInput)
  .handler(async ({ data }): Promise<RsvpRecord> => {
    const { upsertRsvp } = await import("./album-store.server");
    return upsertRsvp(data);
  });

export const listRsvps = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    confirmed: RsvpRecord[];
    declined: RsvpRecord[];
    guestCount: number;
  }> => {
    const { assertHost } = await import("./host.server");
    assertHost();
    const { allRsvps } = await import("./album-store.server");
    return allRsvps();
  },
);
