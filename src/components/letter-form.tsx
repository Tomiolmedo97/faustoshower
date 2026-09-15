import { useEffect, useState, type FormEvent } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOrCreateClientId } from "@/lib/event";
import { getMyLetter, submitLetter, type LetterRecord } from "@/lib/letters";

const MAX_BODY = 600;

export function LetterForm() {
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<LetterRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    const id = getOrCreateClientId();
    setClientId(id);
    let cancelled = false;
    void getMyLetter({ data: { clientId: id } })
      .then((existing) => {
        if (cancelled || !existing) return;
        setSaved(existing);
        setName(existing.authorName);
        setBody(existing.body);
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
    if (!clientId || name.trim().length < 2 || body.trim().length < 8) return;
    setSaving(true);
    setError(null);
    try {
      const record = await submitLetter({
        data: {
          clientId,
          authorName: name.trim(),
          body: body.trim(),
        },
      });
      setSaved(record);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar. Probá de nuevo.",
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
            Quedó guardada
          </p>
          <p className="font-serif text-lg text-pretty text-ink/80">
            Gracias, {saved.authorName}. Se la vamos a leer a Fausto.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="text-muted"
          onClick={() => setEditing(true)}
        >
          <RotateCcw className="size-4" />
          Editar carta
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="space-y-2">
        <Label htmlFor="letter-name">Tu nombre</Label>
        <Input
          id="letter-name"
          name="author"
          autoComplete="name"
          placeholder="Nombre y apellido"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="letter-body">Tu carta</Label>
        <Textarea
          id="letter-body"
          name="body"
          placeholder="Un deseo, un consejo, o lo que quieras decirle…"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          required
          minLength={8}
          maxLength={MAX_BODY}
          rows={7}
        />
        <p className="text-right font-serif text-xs tabular-nums text-muted">
          {body.length}/{MAX_BODY}
        </p>
      </div>
      {error && (
        <p className="text-center font-serif text-sm text-brown" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          name.trim().length < 2 ||
          body.trim().length < 8 ||
          saving ||
          !clientId
        }
        className="w-full"
      >
        {saving ? "Guardando…" : saved ? "Guardar cambios" : "Dejar carta"}
      </Button>
    </form>
  );
}
