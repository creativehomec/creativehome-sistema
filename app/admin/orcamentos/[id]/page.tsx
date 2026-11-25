import { notFound } from "next/navigation";
import { getBudgetWithSections } from "@/lib/budgets";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getCurrentUsername } from "@/lib/session";
import { BudgetEditor } from "@/components/admin/budget/BudgetEditor";
import { BudgetGeneralInfoForm } from "@/components/admin/BudgetGeneralInfoForm";
import { BudgetRecurringCalculator } from "@/components/admin/BudgetRecurringCalculator";
import { BudgetFreelaCalculator } from "@/components/admin/BudgetFreelaCalculator";
import { BudgetPublishBox } from "@/components/admin/BudgetPublishBox";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function BudgetEditPage({ params }: { params: Params }) {
  const { id } = await params;
  const [budget, username] = await Promise.all([
    getBudgetWithSections(id),
    getCurrentUsername(),
  ]);

  if (!budget) notFound();

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-6">
      <AdminHeader
        title={budget.title}
        dense
        trail={[
          { label: "Admin", href: "/admin" },
          { label: "Orçamentos", href: "/admin/orcamentos" },
          { label: budget.title },
        ]}
        username={username}
      />

      <BudgetEditor
        budget={budget}
        config={
          <>
            <BudgetPublishBox budget={budget} />
            <BudgetGeneralInfoForm budget={budget} />
            {/* Recolhidas: são de uso raro e ocupavam a aba inteira. O <details>
                mantém o conteúdo montado, então o que se digitou não se perde. */}
            <details className="group rounded-lg border border-neutral-200 bg-white [&_h2]:hidden [&>div>section]:border-0 [&>div>section]:p-0">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-neutral-900 marker:text-neutral-500 max-lg:min-h-11">
                Calculadora recorrente (por níveis)
              </summary>
              <div className="px-4 pb-4">
                <BudgetRecurringCalculator
                  budget={budget}
                  hasPackages={budget.packages.length > 0}
                />
              </div>
            </details>
            <details className="group rounded-lg border border-neutral-200 bg-white [&_h2]:hidden [&>div>section]:border-0 [&>div>section]:p-0">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-neutral-900 marker:text-neutral-500 max-lg:min-h-11">
                Calculadora de freela
              </summary>
              <div className="px-4 pb-4">
                <BudgetFreelaCalculator budgetId={budget.id} />
              </div>
            </details>
          </>
        }
      />
    </div>
  );
}
