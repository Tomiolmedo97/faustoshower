import { useEffect, useState } from "react";
import { EVENT } from "@/lib/event";
import { cn } from "@/lib/utils";

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const UNITS = [
  { key: "days", label: "días" },
  { key: "hours", label: "horas" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "seg" },
] as const;

const START = Date.parse(EVENT.startIso);
const END = Date.parse(EVENT.endIso);

function split(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const ready = now !== null;
  const started = ready && now >= START;
  const finished = ready && now >= END;
  const parts = split(START - (now ?? START));

  return (
    <section
      className="invite-card mt-5 w-full rounded-xl px-6 py-8 sm:px-10"
      aria-label="Cuenta regresiva"
    >
      {finished ? (
        <QuietNote
          script="Gracias"
          body="Por acompañar a Fausto en su día."
        />
      ) : started ? (
        <QuietNote script="Es hoy" body={`${EVENT.timeLabel} · ${EVENT.venue}`} />
      ) : (
        <div className="flex flex-col items-center text-center">
          <p className="script-heading text-sage">
            Falta
          </p>
          <span className="hairline mt-5 w-16" />
          <div
            className={cn(
              "mt-5 grid w-full max-w-sm grid-cols-4",
              !ready && "invisible",
            )}
          >
            {UNITS.map((unit) => (
              <div key={unit.key} className="flex flex-col items-center gap-2">
                <span className="digit font-serif text-4xl font-medium leading-none tabular-nums text-brown sm:text-5xl">
                  <span key={pad(parts[unit.key])} className="digit-tick">
                    {pad(parts[unit.key])}
                  </span>
                </span>
                <span className="font-serif text-xs tracking-invite text-sage uppercase">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function QuietNote({ script, body }: { script: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <p className="script-heading text-sage">
        {script}
      </p>
      <p className="font-serif text-lg text-muted">{body}</p>
    </div>
  );
}
