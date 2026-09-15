import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { listRsvps, type RsvpRecord } from "@/lib/rsvp";

export const Route = createFileRoute("/anfitriones")({
  loader: () => listRsvps(),
  component: HostPage,
});

function HostPage() {
  const { confirmed, declined, guestCount } = Route.useLoaderData();

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
          <p className="font-script text-4xl leading-none text-sage">
            Confirmaciones
          </p>
          <p className="mt-3 font-serif text-base text-muted">
            Baby Shower de Fausto
          </p>
        </header>

        <dl className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="Van" value={guestCount} />
          <Stat label="Familias" value={confirmed.length} />
          <Stat label="No pueden" value={declined.length} />
        </dl>

        <GuestList title="Asisten" people={confirmed} empty="Todavía nadie confirmó." />
        <GuestList
          title="No asisten"
          people={declined}
          empty="Nadie avisó que no puede venir."
        />
      </article>
    </main>
  );
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
