import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { ALBUM_FILE, ALBUM_REPO_SSH, deployKeyPath } from "./album-key.server";
import type { LetterRecord } from "./letters";
import type { RsvpRecord } from "./rsvp";

// @ts-expect-error package ships without types
import { createSshHttpClient } from "jsgit-ssh";

type Album = {
  seq: number;
  rsvps: RsvpRecord[];
  letters: LetterRecord[];
};

const AUTHOR = {
  name: "Fausto Shower",
  email: "80988373+Tomiolmedo97@users.noreply.github.com",
};

function useGitAlbum() {
  return Boolean(process.env.VERCEL) && !process.env.DATABASE_URL?.trim();
}

function emptyAlbum(): Album {
  return { seq: 1, rsvps: [], letters: [] };
}

function parseAlbum(raw: string): Album {
  try {
    const parsed = JSON.parse(raw) as Partial<Album>;
    const rsvps = Array.isArray(parsed.rsvps) ? parsed.rsvps : [];
    const letters = Array.isArray(parsed.letters) ? parsed.letters : [];
    const seq =
      typeof parsed.seq === "number" && parsed.seq > 0
        ? parsed.seq
        : Math.max(1, rsvps.length + letters.length + 1);
    return { seq, rsvps, letters };
  } catch {
    return emptyAlbum();
  }
}

function repoDir() {
  return join(tmpdir(), "fausto-album", "repo");
}

function openSsh() {
  return createSshHttpClient({
    url: ALBUM_REPO_SSH,
    identityFile: deployKeyPath(),
    trustNewHosts: true,
    knownHostsPath: join(tmpdir(), "fausto-album", "known_hosts"),
  }) as {
    http: NonNullable<Parameters<typeof git.clone>[0]["http"]>;
    url: string;
    dispose: () => Promise<void> | void;
  };
}

async function syncRepo(
  http: NonNullable<Parameters<typeof git.clone>[0]["http"]>,
  url: string,
  dir: string,
) {
  const gitDir = join(dir, ".git");
  try {
    if (!fs.existsSync(gitDir)) throw new Error("missing-repo");
    await git.fetch({
      fs,
      http,
      dir,
      url,
      remote: "origin",
      ref: "main",
      depth: 1,
      singleBranch: true,
    });
    const oid = await git.resolveRef({
      fs,
      dir,
      ref: "refs/remotes/origin/main",
    });
    await git.writeRef({
      fs,
      dir,
      ref: "refs/heads/main",
      value: oid,
      force: true,
    });
    await git.checkout({ fs, dir, ref: "main", force: true });
  } catch {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    await git.clone({
      fs,
      http,
      url,
      dir,
      depth: 1,
      singleBranch: true,
      ref: "main",
    });
  }
}

let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

let memory: { album: Album; at: number } | null = null;
const READ_TTL_MS = 3_000;

function remember(album: Album) {
  memory = { album, at: Date.now() };
}

async function gitLoad(force: boolean): Promise<Album> {
  if (!force && memory && Date.now() - memory.at < READ_TTL_MS) {
    return structuredClone(memory.album);
  }
  const { http, url, dispose } = openSsh();
  const dir = repoDir();
  try {
    await syncRepo(http, url, dir);
    const path = join(dir, ALBUM_FILE);
    const album = fs.existsSync(path)
      ? parseAlbum(fs.readFileSync(path, "utf8"))
      : emptyAlbum();
    remember(album);
    return structuredClone(album);
  } finally {
    await dispose();
  }
}

async function gitUpdate(mutator: (album: Album) => void): Promise<Album> {
  const dir = repoDir();
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { http, url, dispose } = openSsh();
    try {
      await syncRepo(http, url, dir);
      const path = join(dir, ALBUM_FILE);
      const album = fs.existsSync(path)
        ? parseAlbum(fs.readFileSync(path, "utf8"))
        : emptyAlbum();
      mutator(album);
      const previous = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
      const next = `${JSON.stringify(album, null, 2)}\n`;
      fs.writeFileSync(path, next, "utf8");
      if (previous !== next) {
        await git.add({ fs, dir, filepath: ALBUM_FILE });
        await git.commit({
          fs,
          dir,
          message: "actualizar álbum",
          author: AUTHOR,
        });
        await git.push({ fs, http, url, dir, ref: "main", remote: "origin" });
      }
      remember(album);
      return structuredClone(album);
    } catch (err) {
      lastError = err;
      memory = null;
      fs.rmSync(dir, { recursive: true, force: true });
    } finally {
      await dispose();
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo guardar el álbum");
}

async function sql() {
  const { getSql } = await import("./db");
  return getSql();
}

export async function findLetter(clientId: string): Promise<LetterRecord | null> {
  if (useGitAlbum()) {
    return enqueue(async () => {
      const album = await gitLoad(false);
      return album.letters.find((row) => row.clientId === clientId) ?? null;
    });
  }
  const db = await sql();
  const rows = await db<{
    id: number;
    client_id: string;
    author_name: string;
    body: string;
    created_at: string | Date;
  }>`
    select id, client_id, author_name, body, created_at
    from letters
    where client_id = ${clientId}
    limit 1
  `;
  return rows[0] ? mapLetter(rows[0]) : null;
}

export async function upsertLetter(input: {
  clientId: string;
  authorName: string;
  body: string;
}): Promise<LetterRecord> {
  if (useGitAlbum()) {
    return enqueue(async () => {
      let saved: LetterRecord | null = null;
      await gitUpdate((album) => {
        const now = new Date().toISOString();
        const existing = album.letters.find((row) => row.clientId === input.clientId);
        if (existing) {
          existing.authorName = input.authorName;
          existing.body = input.body;
          saved = existing;
          return;
        }
        const record: LetterRecord = {
          id: album.seq++,
          clientId: input.clientId,
          authorName: input.authorName,
          body: input.body,
          createdAt: now,
        };
        album.letters.unshift(record);
        saved = record;
      });
      if (!saved) throw new Error("No se pudo guardar la carta");
      return saved;
    });
  }
  const db = await sql();
  const rows = await db<{
    id: number;
    client_id: string;
    author_name: string;
    body: string;
    created_at: string | Date;
  }>`
    insert into letters (client_id, author_name, body, updated_at)
    values (${input.clientId}, ${input.authorName}, ${input.body}, now())
    on conflict (client_id) do update set
      author_name = excluded.author_name,
      body = excluded.body,
      updated_at = now()
    returning id, client_id, author_name, body, created_at
  `;
  const row = rows[0];
  if (!row) throw new Error("No se pudo guardar la carta");
  return mapLetter(row);
}

export async function allLetters(): Promise<LetterRecord[]> {
  if (useGitAlbum()) {
    return enqueue(async () => {
      const album = await gitLoad(true);
      return [...album.letters].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
      );
    });
  }
  const db = await sql();
  const rows = await db<{
    id: number;
    client_id: string;
    author_name: string;
    body: string;
    created_at: string | Date;
  }>`
    select id, client_id, author_name, body, created_at
    from letters
    order by created_at desc
  `;
  return rows.map(mapLetter);
}

export async function findRsvp(clientId: string): Promise<RsvpRecord | null> {
  if (useGitAlbum()) {
    return enqueue(async () => {
      const album = await gitLoad(false);
      return album.rsvps.find((row) => row.clientId === clientId) ?? null;
    });
  }
  const db = await sql();
  const rows = await db<{
    id: number;
    client_id: string;
    guest_name: string;
    attending: boolean;
    party_size: number;
    updated_at: string | Date;
  }>`
    select id, client_id, guest_name, attending, party_size, updated_at
    from rsvps
    where client_id = ${clientId}
    limit 1
  `;
  return rows[0] ? mapRsvp(rows[0]) : null;
}

export async function upsertRsvp(input: {
  clientId: string;
  guestName: string;
  attending: boolean;
  partySize: number;
}): Promise<RsvpRecord> {
  const partySize = input.attending ? Math.max(1, input.partySize) : 0;
  if (useGitAlbum()) {
    return enqueue(async () => {
      let saved: RsvpRecord | null = null;
      await gitUpdate((album) => {
        const now = new Date().toISOString();
        const existing = album.rsvps.find((row) => row.clientId === input.clientId);
        if (existing) {
          existing.guestName = input.guestName;
          existing.attending = input.attending;
          existing.partySize = partySize;
          existing.updatedAt = now;
          saved = existing;
          return;
        }
        const record: RsvpRecord = {
          id: album.seq++,
          clientId: input.clientId,
          guestName: input.guestName,
          attending: input.attending,
          partySize,
          updatedAt: now,
        };
        album.rsvps.push(record);
        saved = record;
      });
      if (!saved) throw new Error("No se pudo guardar la confirmación");
      return saved;
    });
  }
  const db = await sql();
  const rows = await db<{
    id: number;
    client_id: string;
    guest_name: string;
    attending: boolean;
    party_size: number;
    updated_at: string | Date;
  }>`
    insert into rsvps (client_id, guest_name, attending, party_size, updated_at)
    values (${input.clientId}, ${input.guestName}, ${input.attending}, ${partySize}, now())
    on conflict (client_id) do update set
      guest_name = excluded.guest_name,
      attending = excluded.attending,
      party_size = excluded.party_size,
      updated_at = now()
    returning id, client_id, guest_name, attending, party_size, updated_at
  `;
  const row = rows[0];
  if (!row) throw new Error("No se pudo guardar la confirmación");
  return mapRsvp(row);
}

export async function allRsvps(): Promise<{
  confirmed: RsvpRecord[];
  declined: RsvpRecord[];
  guestCount: number;
}> {
  if (useGitAlbum()) {
    return enqueue(async () => {
      const album = await gitLoad(true);
      const records = [...album.rsvps].sort((a, b) => {
        if (a.attending !== b.attending) return a.attending ? -1 : 1;
        return a.guestName.localeCompare(b.guestName, "es");
      });
      const confirmed = records.filter((row) => row.attending);
      const declined = records.filter((row) => !row.attending);
      const guestCount = confirmed.reduce((sum, row) => sum + row.partySize, 0);
      return { confirmed, declined, guestCount };
    });
  }
  const db = await sql();
  const rows = await db<{
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
  const records = rows.map(mapRsvp);
  const confirmed = records.filter((row) => row.attending);
  const declined = records.filter((row) => !row.attending);
  const guestCount = confirmed.reduce((sum, row) => sum + row.partySize, 0);
  return { confirmed, declined, guestCount };
}

function mapLetter(row: {
  id: number;
  client_id: string;
  author_name: string;
  body: string;
  created_at: string | Date;
}): LetterRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    authorName: row.author_name,
    body: row.body,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
  };
}

function mapRsvp(row: {
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
