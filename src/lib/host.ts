import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const isHostSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    const { isHostUnlocked } = await import("./host.server");
    return isHostUnlocked();
  },
);

export const unlockHost = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(40) }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { unlockHostCookie, verifyHostPin } = await import("./host.server");
    if (!verifyHostPin(data.pin.trim())) {
      throw new Error("Clave incorrecta");
    }
    unlockHostCookie();
    return { ok: true };
  });
