import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchStreetAddressesFn } from "@/lib/share/server-fns";

/** Bias autocomplete toward Acadiana / corridor. */
const BIAS = { lat: 30.2241, lon: -92.0198 };

type Suggestion = {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
};

type Props = {
  id?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Fired when the rider picks a suggestion (includes map coords). */
  onResolved?: (point: { label: string; lat: number; lng: number }) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

function leadingHouseNumber(q: string): string {
  const m = q.trim().match(/^(\d+[A-Za-z]?)\b/);
  return m?.[1] ?? "";
}

function withHouseNumber(label: string, house: string): string {
  if (!house) return label;
  const t = label.trim();
  if (new RegExp(`^${house}\\b`, "i").test(t)) return t;
  return `${house} ${t}`.replace(/\s{2,}/g, " ");
}

function formatFeature(
  props: Record<string, unknown>,
  typedHouse = "",
): string {
  const name = String(props.name ?? "").trim();
  const num = String(props.housenumber ?? "").trim() || typedHouse;
  const street = String(props.street ?? "").trim();
  const city = String(props.city ?? props.locality ?? props.county ?? "").trim();
  const state = String(props.state ?? "").trim();
  const postcode = String(props.postcode ?? "").trim();

  const line1 = [num, street || name].filter(Boolean).join(" ").trim();
  if (name && street && name !== street) {
    const placeLine = [name, num ? `${num} ${street}` : street]
      .filter(Boolean)
      .join(" — ");
    const cityLine = [city, state, postcode].filter(Boolean).join(", ");
    return [placeLine, cityLine].filter(Boolean).join(", ");
  }
  const cityLine = [city, state, postcode].filter(Boolean).join(", ");
  return [line1 || name, cityLine].filter(Boolean).join(", ");
}

async function searchPhoton(q: string, typedHouse: string): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    q,
    lat: String(BIAS.lat),
    lon: String(BIAS.lon),
    limit: "6",
    lang: "en",
  });
  if (typedHouse) params.set("layer", "house");
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Address lookup failed");
  const data = (await res.json()) as {
    features?: {
      properties?: Record<string, unknown>;
      geometry?: { coordinates?: number[] };
    }[];
  };
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const f of data.features ?? []) {
    const label = formatFeature(f.properties ?? {}, typedHouse);
    if (!label || label.length < 4) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const coords = f.geometry?.coordinates;
    const lng = Number(coords?.[0]);
    const lat = Number(coords?.[1]);
    out.push({
      id: `${key}-${out.length}`,
      label,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    });
  }
  // Also fetch streets (no layer) so we can attach the typed house number
  if (typedHouse) {
    try {
      const p2 = new URLSearchParams({
        q,
        lat: String(BIAS.lat),
        lon: String(BIAS.lon),
        limit: "3",
        lang: "en",
      });
      const r2 = await fetch(`https://photon.komoot.io/api/?${p2}`, {
        headers: { Accept: "application/json" },
      });
      if (r2.ok) {
        const d2 = (await r2.json()) as {
          features?: {
            properties?: Record<string, unknown>;
            geometry?: { coordinates?: number[] };
          }[];
        };
        for (const f of d2.features ?? []) {
          const label = formatFeature(f.properties ?? {}, typedHouse);
          const key = label.toLowerCase();
          if (!label || seen.has(key)) continue;
          seen.add(key);
          const coords = f.geometry?.coordinates;
          const lng = Number(coords?.[0]);
          const lat = Number(coords?.[1]);
          out.push({
            id: `${key}-${out.length}`,
            label,
            lat: Number.isFinite(lat) ? lat : undefined,
            lng: Number.isFinite(lng) ? lng : undefined,
          });
        }
      }
    } catch {
      /* street fallback optional */
    }
  }
  return out;
}

async function searchAddresses(q: string): Promise<Suggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const house = leadingHouseNumber(query);
  const [photon, nomi] = await Promise.all([
    searchPhoton(query, house).catch(() => [] as Suggestion[]),
    house
      ? searchStreetAddressesFn({ data: { q: query } })
          .then((r) =>
            r.items.map((it, i) => ({
              id: `n-${i}-${it.label}`,
              label: withHouseNumber(it.label, house),
              lat: it.lat,
              lng: it.lng,
            })),
          )
          .catch(() => [] as Suggestion[])
      : Promise.resolve([] as Suggestion[]),
  ]);
  const seen = new Set<string>();
  const merged: Suggestion[] = [];
  // Nominatim first when we typed a house number — it keeps 401, not just the street
  for (const s of [...nomi, ...photon]) {
    const key = s.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(s);
  }
  return merged.slice(0, 8);
}

/**
 * Free-text address with as-you-type suggestions (OpenStreetMap).
 * House numbers are kept even when the map only knows the street.
 */
export function AddressField({
  id: idProp,
  label,
  hint,
  value,
  onChange,
  onResolved,
  placeholder,
  required,
  className,
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      void searchAddresses(q)
        .then((list) => {
          setItems(list);
          setOpen(list.length > 0);
          setActive(-1);
        })
        .catch(() => {
          setItems([]);
        })
        .finally(() => setLoading(false));
    }, 320);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  function pick(s: Suggestion) {
    skipNextSearch.current = true;
    const house = leadingHouseNumber(value);
    const label = withHouseNumber(s.label, house);
    onChange(label);
    if (
      onResolved &&
      s.lat != null &&
      s.lng != null &&
      Number.isFinite(s.lat) &&
      Number.isFinite(s.lng)
    ) {
      onResolved({ label, lat: s.lat, lng: s.lng });
    }
    setItems([]);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div ref={wrapRef} className={cn("relative space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {hint && (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      )}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-3 size-4 text-[var(--color-fg-subtle)]" />
        <textarea
          id={id}
          required={required}
          rows={2}
          inputMode="text"
          value={value}
          autoComplete="street-address"
          placeholder={placeholder ?? "401 Johnston St, Lafayette, LA"}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (items.length) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || items.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              pick(items[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(
            "flex w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-9 pr-9 text-sm text-[var(--color-fg)] shadow-sm outline-none transition",
            "placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
            "min-h-[2.75rem]",
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-[var(--color-fg-subtle)]" />
        )}
      </div>
      {open && items.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-1 shadow-[var(--shadow-md)]"
        >
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm",
                  i === active
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-fg)]"
                    : "text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" />
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
