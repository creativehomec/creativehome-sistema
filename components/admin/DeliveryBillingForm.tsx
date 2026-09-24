"use client";

import { useState, useTransition } from "react";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type ContractType,
  type PaymentMethod,
  type ServiceOption,
} from "@/lib/backlogTypes";
import { formatBRL } from "@/lib/billingTypes";
import { updateDeliveryBillingAction } from "@/app/admin/clientes/faturamento/actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-neutral-600";

export interface DeliveryBilling {
  card_id: string;
  contract_type: ContractType | null;
  custom_service: string | null;
  service_id: string | null;
  quantity: number;
  unit_price_cents: number | null;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
}

/**
 * Cobrança de uma entrega, lançada pelo financeiro. Mora aqui e não no card
 * do quadro: o quadro é do time e só diz cliente e etapa. Escolher um serviço
 * só preenche o valor sugerido — o preço fica gravado na entrega, então mexer
 * no catálogo depois não altera o que já foi lançado.
 */
export function DeliveryBillingForm({
  delivery,
  services,
  onDone,
}: {
  delivery: DeliveryBilling;
  services: ServiceOption[];
  onDone: () => void;
}) {
  const [price, setPrice] = useState(
    delivery.unit_price_cents === null
      ? ""
      : (delivery.unit_price_cents / 100).toFixed(2).replace(".", ",")
  );
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          await updateDeliveryBillingAction(formData);
          onDone();
        });
      }}
      className="mt-2 w-full space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3"
    >
      <input type="hidden" name="card_id" value={delivery.card_id} />

      <div>
        <p className={labelClass}>Tipo de contrato</p>
        <div className="flex flex-wrap gap-1.5">
          {[...CONTRACT_TYPES, "none" as const].map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 has-checked:border-neutral-900 has-checked:bg-neutral-900 has-checked:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-900 pointer-coarse:min-h-11"
            >
              <input
                type="radio"
                name="contract_type"
                value={option}
                defaultChecked={(delivery.contract_type ?? "none") === option}
                className="sr-only"
              />
              {option === "none" ? "Não definido" : CONTRACT_TYPE_LABELS[option]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={labelClass}>Cobrança</p>
        <input
          name="custom_service"
          defaultValue={delivery.custom_service ?? ""}
          placeholder="Produto personalizado (opcional)"
          aria-label="Produto personalizado"
          className={`${inputClass} mb-2`}
        />
        <div className="grid grid-cols-[1fr_5rem_7rem] gap-2">
          <select
            name="service_id"
            aria-label="Serviço"
            defaultValue={delivery.service_id ?? "none"}
            onChange={(event) => {
              const service = services.find((item) => item.id === event.target.value);
              if (service) {
                setPrice((service.price_cents / 100).toFixed(2).replace(".", ","));
              }
            }}
            className={inputClass}
          >
            <option value="none">Sem serviço</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {formatBRL(service.price_cents)}
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            min={1}
            step={1}
            aria-label="Quantidade"
            defaultValue={delivery.quantity}
            className={inputClass}
          />
          <input
            name="unit_price_cents"
            inputMode="decimal"
            aria-label="Valor unitário"
            placeholder="R$ 0,00"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={inputClass}
          />
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          Escrito no produto personalizado, é esse nome que aparece na nota — o
          catálogo continua intacto.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-neutral-600">
          Pago em
          <input
            type="date"
            name="paid_at"
            defaultValue={delivery.paid_at ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Forma
          <select
            name="payment_method"
            defaultValue={delivery.payment_method ?? "none"}
            className={`mt-1 ${inputClass}`}
          >
            <option value="none">Não informada</option>
            {PAYMENT_METHODS.map((option) => (
              <option key={option} value={option}>
                {PAYMENT_METHOD_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 pointer-coarse:min-h-11"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-neutral-500 hover:text-neutral-800 pointer-coarse:min-h-11"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Botão "Lançar/Editar cobrança" que abre o formulário na própria linha. */
export function DeliveryBillingToggle({
  delivery,
  services,
  priceSet,
}: {
  delivery: DeliveryBilling;
  services: ServiceOption[];
  priceSet: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <DeliveryBillingForm
        delivery={delivery}
        services={services}
        onDone={() => setOpen(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="text-xs font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline pointer-coarse:min-h-11"
    >
      {priceSet ? "Editar cobrança" : "Lançar cobrança"}
    </button>
  );
}
