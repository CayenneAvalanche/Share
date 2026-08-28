import { MapPin } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import {
  RADIUS_OPTIONS_LOCAL,
  SUGGESTED_SEARCH_CITIES,
} from "@/lib/share/geo";

type Props = {
  city: string;
  radius: number;
  onCityChange: (city: string) => void;
  onRadiusChange: (mi: number) => void;
  /** Extra radius choices (e.g. wider for corridors) */
  radiusOptions?: readonly { value: number; label: string }[];
  hint?: string;
  idPrefix?: string;
};

export function NearMeBar({
  city,
  radius,
  onCityChange,
  onRadiusChange,
  radiusOptions = RADIUS_OPTIONS_LOCAL,
  hint,
  idPrefix = "near",
}: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-sm)]">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
        <MapPin className="size-3.5 text-[var(--color-primary)]" />
        Near me · sort by distance
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7.5rem]">
        <div>
          <Label htmlFor={`${idPrefix}-city`} className="sr-only">
            Your city
          </Label>
          <Input
            id={`${idPrefix}-city`}
            list={`${idPrefix}-cities`}
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Your city, ST"
            autoComplete="address-level2"
          />
          <datalist id={`${idPrefix}-cities`}>
            {SUGGESTED_SEARCH_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-radius`} className="sr-only">
            Radius
          </Label>
          <Select
            id={`${idPrefix}-radius`}
            value={String(radius)}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
          >
            {radiusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}
