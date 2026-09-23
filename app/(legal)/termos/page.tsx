import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Termos de Serviço — ${brand.name}`,
  description: `Condições de uso do ${brand.productName}.`,
};

/**
 * Exigida pelo Google junto com a política de privacidade para publicar o app
 * OAuth.
 *
 * REVISE com quem cuida do jurídico antes de publicar: descreve como o
 * sistema funciona hoje, não é parecer legal. Foro e razão social completa
 * saem de `lib/brand.ts`.
 */
const ATUALIZADO_EM = "23 de setembro de 2026";

export default function TermosDeServico() {
  return (
    <article>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Termos de Serviço
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Última atualização: {ATUALIZADO_EM}
      </p>

      <Secao titulo="1. O que é este serviço">
        <P>
          O {brand.productName} é um sistema interno de gestão operado por{" "}
          {brand.legalName}. Serve para a equipe organizar entregas, agenda,
          orçamentos, clientes e galerias. Não é um produto aberto ao público:
          o acesso depende de conta criada pela administração do estúdio.
        </P>
      </Secao>

      <Secao titulo="2. Quem pode usar">
        <P>
          O uso é restrito a integrantes da equipe e a colaboradores
          autorizados. Cada pessoa é responsável por manter suas credenciais em
          sigilo e responde pelo que for feito com a sua conta. Comunique a
          administração ao suspeitar de acesso indevido.
        </P>
      </Secao>

      <Secao titulo="3. Conexão com sua conta Google">
        <P>
          A conexão com o Google Agenda é opcional. Ao autorizá-la, você
          permite que o sistema crie e atualize, na sua agenda principal, os
          eventos correspondentes às entregas com data marcada.
        </P>
        <P>
          Você pode revogar essa autorização quando quiser, dentro do sistema
          ou em myaccount.google.com/permissions. Os eventos já criados
          continuam na sua agenda e são seus.
        </P>
        <P>
          O que fazemos com os dados obtidos do Google está descrito na{" "}
          <Link
            href="/privacidade"
            className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
          >
            Política de Privacidade
          </Link>
          , que é parte integrante destes termos.
        </P>
      </Secao>

      <Secao titulo="4. Uso aceitável">
        <P>Ao usar o sistema, você concorda em não:</P>
        <Lista
          itens={[
            "acessar ou tentar acessar dados de outras pessoas sem autorização;",
            "usar o sistema para finalidade ilícita ou que viole direitos de terceiros;",
            "extrair, copiar ou redistribuir conteúdo de clientes fora do escopo do seu trabalho;",
            "interferir no funcionamento do serviço ou contornar seus controles de acesso.",
          ]}
        />
      </Secao>

      <Secao titulo="5. Conteúdo e propriedade">
        <P>
          O material de clientes hospedado ou referenciado no sistema pertence
          a quem de direito, conforme os contratos de cada projeto. Estes
          termos não transferem titularidade de nada. O software e a identidade
          visual do {brand.name} permanecem de {brand.legalName}.
        </P>
      </Secao>

      <Secao titulo="6. Disponibilidade">
        <P>
          O serviço é fornecido no estado em que se encontra. Não garantimos
          funcionamento ininterrupto nem ausência de erros, e dependemos de
          provedores externos — Google, Vercel e Supabase — cujas
          indisponibilidades estão fora do nosso controle. Fazemos o razoável
          para manter o sistema no ar e os dados íntegros.
        </P>
      </Secao>

      <Secao titulo="7. Encerramento de acesso">
        <P>
          A administração pode suspender ou encerrar contas a qualquer momento,
          especialmente ao fim do vínculo de trabalho ou diante de uso em
          desacordo com estes termos. Você também pode pedir o encerramento da
          sua conta pelo canal de contato.
        </P>
      </Secao>

      <Secao titulo="8. Mudanças nestes termos">
        <P>
          Podemos atualizar estes termos para refletir mudanças no sistema ou
          na legislação. A data no topo indica a última revisão; alterações
          relevantes serão comunicadas à equipe.
        </P>
      </Secao>

      <Secao titulo="9. Lei aplicável">
        <P>
          Estes termos são regidos pelas leis da República Federativa do
          Brasil.
        </P>
      </Secao>

      <Secao titulo="10. Contato">
        <P>
          Dúvidas sobre estes termos:{" "}
          {brand.contactUrl ? (
            <a
              href={brand.contactUrl}
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              fale com {brand.legalName}
            </a>
          ) : (
            <>entre em contato com {brand.legalName}.</>
          )}
        </P>
      </Secao>
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-neutral-900">{titulo}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-neutral-700">{children}</p>;
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700">
      {itens.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
