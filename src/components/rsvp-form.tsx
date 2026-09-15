import { useEffect, useState, type FormEvent } from "react";
import { Check, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyRsvp, submitRsvp, type RsvpRecord } from "@/lib/rsvp";
import { getOrCreateClientId, whatsappRsvpLink } from "@/lib/event";
import { cn } from "@/lib/utils";

type Choice = boolean | null;

export function RsvpForm() {
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<RsvpRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [choice, setChoice] = useState<Choice>(null);
  const [partySize, setPartySize] = useState(1);

  useEffect(() => {
    const id = getOrCreateClientId();
    setClientId(id);
    let cancelled = false;
    void getMyRsvp({ data: { clientId: id } })
      .then((existing) => {
        if (cancelled || !existing) return;
        setSaved(existing);
        setName(existing.guestName);
        setChoice(existing.attending);
        setPartySize(Math.max(1, existing.partySize || 1));
      })
      .catch(() => {
        /* form stays ready even if lookup fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (choice === null || !name.trim() || !clientId) return;
    setSaving(true);
    setError(null);
    try {
      const record = await submitRsvp({
        data: {
          clientId,
          guestName: name.trim(),
          attending: choice,
          partySize: choice ? partySize : 0,
        },
      });
      setSaved(record);
      setEditing(false);
      window.location.assign(
        whatsappRsvpLink(record.guestName, record.attending, record.partySize),
      );
    } catch {
      window.location.assign(
        whatsappRsvpLink(name.trim(), choice, choice ? partySize : 0),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar. Probá de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (saved && !editing) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-sage/12 text-sage">
          <Check className="size-7" strokeWidth={1.75} />
        </span>
        <div className="space-y-2">
          <p className="font-script text-4xl leading-none text-sage">
            {saved.attending ? "¡Te esperamos!" : "Gracias por avisarnos"}
          </p>
          <p className="font-serif text-lg text-pretty text-ink/80">
            {saved.attending ? (
              <>
                {saved.guestName}
                {saved.partySize > 1 ? `, grupo de ${saved.partySize}` : ""} ·
                confirmado
              </>
            ) : (
              <>{saved.guestName}, te vamos a extrañar ese día.</>
            )}
          </p>
        </div>
        <Button asChild className="w-full">
          <a
            href={whatsappRsvpLink(
              saved.guestName,
              saved.attending,
              saved.partySize,
            )}
          >
            Enviar por WhatsApp
          </a>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-muted"
          onClick={() => setEditing(true)}
        >
          <RotateCcw className="size-4" />
          Cambiar respuesta
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset className="space-y-3">
        <legend className="sr-only">¿Nos acompañás?</legend>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceButton
            selected={choice === true}
            onClick={() => setChoice(true)}
            label="Sí, voy"
            hint="Con alegría"
          />
          <ChoiceButton
            selected={choice === false}
            onClick={() => setChoice(false)}
            label="No podré"
            hint="Esta vez no"
            tone="muted"
          />
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="guest-name">Nombre</Label>
        <Input
          id="guest-name"
          name="name"
          autoComplete="name"
          placeholder="Nombre y apellido"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
        />
      </div>

      {choice === true && (
        <div className="space-y-2">
          <Label htmlFor="party-size">¿Cuántos serán?</Label>
          <div className="flex items-center justify-between gap-3 rounded-md bg-paper-deep px-2 py-1 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-sage)_22%,transparent)]">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-sm text-sage transition-colors hover:bg-sage/10"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              aria-label="Menos invitados"
            >
              <Minus className="size-4" />
            </button>
            <span
              id="party-size"
              className="min-w-10 text-center font-serif text-2xl tabular-nums text-ink"
            >
              {partySize}
            </span>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-sm text-sage transition-colors hover:bg-sage/10"
              onClick={() => setPartySize((n) => Math.min(12, n + 1))}
              aria-label="Más invitados"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-center font-serif text-sm text-brown" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={choice === null || name.trim().length < 2 || saving || !clientId}
        className="w-full"
      >
        {saving ? "Abriendo WhatsApp…" : "Confirmar por WhatsApp"}
      </Button>
    </form>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
  hint,
  tone = "sage",
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  tone?: "sage" | "muted";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-20 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-3 text-center transition-[background-color,box-shadow,color] duration-(--motion-quick) ease-(--ease-out)",
        selected
          ? tone === "sage"
            ? "bg-sage text-paper shadow-[0_1px_0_color-mix(in_oklab,var(--color-ink)_10%,transparent)]"
            : "bg-brown text-paper"
          : "bg-paper-deep text-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-sage)_20%,transparent)] hover:shadow-[inset_0_0_0_1px_var(--color-sage)]",
      )}
    >
      <span className="font-serif text-lg font-medium leading-tight">
        {label}
      </span>
      <span
        className={cn(
          "font-serif text-xs tracking-wide",
          selected ? "text-paper/75" : "text-muted",
        )}
      >
        {hint}
      </span>
    </button>
  );
}
