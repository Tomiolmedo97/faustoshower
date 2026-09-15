import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export const getMyLetter = createServerFn({ method: "POST" })
  .validator(clientIdInput)
  .handler(async ({ data }): Promise<LetterRecord | null> => {
    const { findLetter } = await import("./album-store.server");
    return findLetter(data.clientId);
  });

export const submitLetter = createServerFn({ method: "POST" })
  .validator(letterInput)
  .handler(async ({ data }): Promise<LetterRecord> => {
    const { upsertLetter } = await import("./album-store.server");
    return upsertLetter(data);
  });

export const listLetters = createServerFn({ method: "GET" }).handler(
  async (): Promise<LetterRecord[]> => {
    const { assertHost } = await import("./host.server");
    assertHost();
    const { allLetters } = await import("./album-store.server");
    return allLetters();
  },
);
