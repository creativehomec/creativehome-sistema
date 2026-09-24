"use client";

import { Pipette } from "lucide-react";
import {
  CLIENT_COLORS,
  clientColorSolid,
  type ClientColorKey,
} from "@/lib/backlogTypes";

const KEYS = Object.keys(CLIENT_COLORS) as ClientColorKey[];

const RING =
  "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1 focus-visible:outline-none";

/**
 * As onze cores da paleta como atalho e, no fim, o seletor de cor do sistema
 * pra qualquer outra. `value` é o que o banco guarda: a chave da paleta ou um
 * hex. Com `name`, vai junto num <form> por um campo escondido.
 */
export function ClientColorPicker({
  value,
  onChange,
  name,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  /** Nome acessível do grupo, ex.: "Cor de Aube". */
  label: string;
}) {
  const custom = !Object.hasOwn(CLIENT_COLORS, value);

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {name ? <input type="hidden" name={name} value={value} /> : null}

      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={CLIENT_COLORS[key].label}
          title={CLIENT_COLORS[key].label}
          onClick={() => onChange(key)}
          className={`grid size-7 place-items-center rounded-full pointer-coarse:size-10 ${RING} ${
            value === key ? "ring-2 ring-neutral-900" : ""
          }`}
        >
          <span
            aria-hidden
            className="size-5 rounded-full border border-black/10"
            style={{ backgroundColor: CLIENT_COLORS[key].fg }}
          />
        </button>
      ))}

      {/* O <input type="color"> fica invisível por cima da bolinha: o clique
          abre o seletor nativo (roda de cor no Mac, conta-gotas no Chrome), e
          a bolinha mostra a cor livre quando ela é a escolhida. */}
      <label
        title="Outra cor"
        className={`relative grid size-7 cursor-pointer place-items-center rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-900 pointer-coarse:size-10 ${
          custom ? "ring-2 ring-neutral-900" : ""
        }`}
      >
        <span
          aria-hidden
          className="grid size-5 place-items-center rounded-full border border-black/10"
          style={{
            background: custom
              ? value
              : "conic-gradient(#ef4444, #f59e0b, #84cc16, #10b981, #0ea5e9, #6366f1, #d946ef, #ef4444)",
          }}
        >
          {custom ? null : <Pipette className="size-3 text-white drop-shadow" />}
        </span>
        <input
          type="color"
          aria-label="Outra cor"
          value={clientColorSolid(value)}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
