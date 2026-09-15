import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarPlus, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import { Countdown } from "@/components/countdown";
import { Reveal } from "@/components/reveal";
import { RsvpForm } from "@/components/rsvp-form";
import { Button } from "@/components/ui/button";
import {
  downloadIcs,
  EVENT,
  GOOGLE_CALENDAR_LINK,
  MAPS_LINK,
} from "@/lib/event";

export const Route = createFileRoute("/")({ component: Home });

const NAME = "Fausto";

function Home() {
  return (
    <main className="relative mx-auto flex min-h-svh w-full max-w-lg flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="sr-only">Baby Shower de Fausto</h1>

      <article className="invite-card invite-hero paper-in relative w-full overflow-hidden px-6 pb-11 pt-5 sm:px-10 sm:pb-12">
        <div
          className="stagger-in mx-auto aspect-square w-[88%] max-w-sm"
          style={{ "--stagger": "120ms" } as CSSProperties}
        >
          <div className="bunny-float relative size-full">
            <img
              src="/bunny.jpg"
              alt="Conejito en un autito verde con globos"
              width={640}
              height={640}
              className="absolute inset-0 size-full scale-110 object-cover object-center select-none"
            />
          </div>
        </div>

        <header className="-mt-4 flex flex-col items-center text-center sm:-mt-6">
          <p className="script-in font-script text-5xl leading-none text-sage sm:text-6xl">
            Baby Shower
          </p>
          <h2
            className="mt-2 flex justify-center font-serif text-5xl font-medium text-brown uppercase sm:text-6xl"
            style={{ gap: "var(--tracking-name)" }}
            aria-label="Fausto"
          >
            {Array.from(NAME).map((letter, i) => (
              <span key={`${letter}-${i}`} className="letter-in">
                {letter}
              </span>
            ))}
          </h2>
        </header>

        <div className="mx-auto mt-7 flex w-full max-w-xs flex-col items-center gap-5 text-center">
          <span
            className="hairline draw w-16"
            style={{ "--stagger": "980ms" } as CSSProperties}
          />
          <p
            className="stagger-in font-serif text-xl tracking-invite text-sage uppercase"
            style={{ "--stagger": "1040ms" } as CSSProperties}
          >
            {EVENT.dateLabel}
            <span className="mx-2 text-sage/50" aria-hidden="true">
              |
            </span>
            {EVENT.timeRange}
          </p>
          <div
            className="stagger-in space-y-1"
            style={{ "--stagger": "1120ms" } as CSSProperties}
          >
            <p className="font-serif text-lg tracking-invite text-sage uppercase">
              {EVENT.addressLine1}
            </p>
            <p className="font-serif text-lg tracking-invite text-sage uppercase">
              {EVENT.addressLine2} ({EVENT.venue})
            </p>
          </div>
          <span
            className="hairline draw w-16"
            style={{ "--stagger": "1220ms" } as CSSProperties}
          />
        </div>

        <div
          className="stagger-in mt-7 flex flex-wrap items-center justify-center gap-2"
          style={{ "--stagger": "1320ms" } as CSSProperties}
        >
          <Button variant="outline" className="px-4" asChild>
            <a
              href={GOOGLE_CALENDAR_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CalendarPlus className="size-4" />
              Google Calendar
            </a>
          </Button>
          <Button type="button" variant="ghost" onClick={downloadIcs}>
            Descargar .ics
          </Button>
        </div>
      </article>

      <Reveal>
        <Countdown />
      </Reveal>

      <Reveal delay={60}>
        <section
          id="confirmar"
          className="invite-card mt-5 w-full scroll-mt-6 rounded-xl px-6 py-10 sm:px-10"
        >
          <div className="mb-8 text-center">
            <p className="font-script text-4xl leading-none text-sage sm:text-5xl">
              Confirmá tu asistencia
            </p>
            <p className="mt-3 font-serif text-base text-muted">
              Por favor, antes del {EVENT.rsvpDeadlineLabel}.
            </p>
          </div>
          <RsvpForm />
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section
          id="ubicacion"
          className="invite-card mt-5 w-full scroll-mt-6 rounded-xl px-6 py-10 sm:px-10"
        >
          <div className="text-center">
            <p className="font-script text-4xl leading-none text-sage sm:text-5xl">
              Cómo llegar
            </p>
            <div className="pin-pop mx-auto mt-6 flex size-14 items-center justify-center rounded-full bg-sage/12 text-sage">
              <MapPin className="size-6" strokeWidth={1.6} />
            </div>
            <p className="mt-4 font-serif text-xl tracking-invite text-ink uppercase">
              {EVENT.venue}
            </p>
            <p className="mt-1 font-serif text-lg text-muted">
              {EVENT.addressLine1} {EVENT.addressLine2}
            </p>
          </div>
          <div className="mt-7 flex justify-center">
            <Button asChild className="w-full sm:w-auto">
              <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer">
                Abrir en Google Maps
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>
        </section>
      </Reveal>

      <Reveal delay={40}>
        <footer className="mt-10 mb-[env(safe-area-inset-bottom)] flex flex-col items-center gap-3 pb-6 text-center">
          <p className="font-script text-3xl text-sage/90">Con cariño</p>
          <Link
            to="/anfitriones"
            className="font-serif text-xs tracking-invite text-sage/60 uppercase transition-colors hover:text-sage"
          >
            Anfitriones
          </Link>
        </footer>
      </Reveal>
    </main>
  );
}