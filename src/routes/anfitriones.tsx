import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHostSession, unlockHost } from "@/lib/host";
import { listLetters, type LetterRecord } from "@/lib/letters";
import { listRsvps, type RsvpRecord } from "@/lib/rsvp";

type HostData =
  | { unlocked: false }
  | {
      unlocked: true;
      confirmed: RsvpRecord[];
      declined: RsvpRecord[];
      guestCount: number;
      letters: LetterRecord[];
      loadError?: boolean;
    };

export const Route = createFileRoute("/anfitriones")({
  loader: async (): Promise<HostData> => {
    const unlocked = await isHostSession();
    if (!unlocked) return { unlocked: false };
    try {
      const [rsvps, letters] = await Promise.all([listRsvps(), listLetters()]);
      return { unlocked: true, ...rsvps, letters };
    } catch (err) {
      console.error("[anfitriones] no se pudo cargar el álbum", err);
      return {
        unlocked: true,
        confirmed: [],
        declined: [],
        guestCount: 0,
        letters: [],
        loadError: true,
      };
    }
  },
  component: HostPage,
});

function HostPage() {
  const data = Route.useLoaderData();
  if (!data.unlocked) return <HostLock />;
  return <HostAlbum data={data} />;
}

function HostLock() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await unlockHost({ data: { pin } });
      await router.invalidate();
    } catch {
      setError("Clave incorrecta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-4 py-10 sm:px-6">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 self-start font-serif text-sm tracking-wide text-sage transition-colors hover:text-sage-deep"
      >
        <ArrowLeft className="size-4" />
        Volver a la invitación
      </Link>

      <article className="invite-card rounded-xl px-6 py-10 sm:px-10">
        <header className="text-center">
          <p className="script-heading text-sage">
            Anfitriones
          </p>
          <p className="mt-3 font-serif text-base text-muted">
            Ingresá la clave para ver confirmaciones y cartas.
          </p>
        </header>

        <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-sm flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="host-pin">Clave</Label>
            <Input
              id="host-pin"
              name="pin"
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-center font-serif text-sm text-brown" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pin.length < 1 || saving} className="w-full">
            {saving ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </article>
    </main>
  );
}

function HostAlbum({
  data,
}: {
  data: Extract<HostData, { unlocked: true }>;
}) {
  const { confirmed, declined, guestCount, letters, loadError } = data;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-4 py-10 sm:px-6">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 self-start font-serif text-sm tracking-wide text-sage transition-colors hover:text-sage-deep"
      >
        <ArrowLeft className="size-4" />
        Volver a la invitación
      </Link>

      <article className="invite-card rounded-xl px-6 py-10 sm:px-10">
        <header className="text-center">
          <p className="script-heading text-sage">
            Confirmaciones
          </p>
          <p className="mt-3 font-serif text-base text-muted">
            Baby Shower de Fausto
          </p>
        </header>

        {loadError ? (
          <p className="mt-8 text-center font-serif text-base text-brown" role="alert">
            No se pudieron cargar las respuestas. Probá de nuevo en un momento.
          </p>
        ) : null}

        <dl className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="Van" value={guestCount} />
          <Stat label="Familias" value={confirmed.length} />
          <Stat label="No pueden" value={declined.length} />
        </dl>

        <GuestList
          title="Asisten"
          people={confirmed}
          empty="Todavía nadie confirmó."
        />
        <GuestList
          title="No asisten"
          people={declined}
          empty="Nadie avisó que no puede venir."
        />
      </article>

      <article className="invite-card mt-5 rounded-xl px-6 py-10 sm:px-10">
        <header className="text-center">
          <p className="script-heading text-sage">
            Cartas para Fausto
          </p>
          <p className="mt-3 font-serif text-base text-muted">
            {letters.length === 0
              ? "Todavía no llegó ninguna."
              : letters.length === 1
                ? "1 carta guardada"
                : `${letters.length} cartas guardadas`}
          </p>
        </header>

        {letters.length === 0 ? (
          <p className="mt-8 text-center font-serif text-base text-muted">
            Cuando un invitado deje un deseo, aparece acá.
          </p>
        ) : (
          <ul className="mt-8 space-y-5">
            {letters.map((letter) => (
              <li
                key={letter.id}
                className="rounded-lg bg-paper-deep px-5 py-5 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-sage)_16%,transparent)]"
              >
                <p className="font-serif text-sm font-medium tracking-[0.16em] text-sage uppercase">
                  {letter.authorName}
                </p>
                <p className="mt-3 font-serif text-lg leading-relaxed whitespace-pre-wrap text-ink">
                  {letter.body}
                </p>
                <p className="mt-4 font-serif text-xs tracking-invite text-muted uppercase">
                  {formatLetterDate(letter.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </main>
  );
}

function formatLetterDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-paper-deep px-3 py-4 text-center">
      <dt className="font-serif text-xs tracking-[0.16em] text-sage uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-3xl tabular-nums text-brown">{value}</dd>
    </div>
  );
}

function GuestList({
  title,
  people,
  empty,
}: {
  title: string;
  people: RsvpRecord[];
  empty: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-sm font-medium tracking-[0.18em] text-sage uppercase">
        {title}
      </h2>
      <span className="hairline mt-3 mb-4 block w-12" />
      {people.length === 0 ? (
        <p className="font-serif text-base text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line/80">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <span className="font-serif text-lg text-ink">
                {person.guestName}
              </span>
              {person.attending && (
                <span className="font-serif text-sm tabular-nums text-muted">
                  {person.partySize === 1
                    ? "1 persona"
                    : `${person.partySize} personas`}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
