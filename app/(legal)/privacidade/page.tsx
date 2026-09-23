import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Política de Privacidade — ${brand.name}`,
  description: `Como o ${brand.name} trata os dados de quem usa o sistema, incluindo os dados obtidos das APIs do Google.`,
};

/**
 * Exigida pelo Google para publicar o app OAuth, e é a página que o revisor
 * lê para decidir se o escopo pedido se justifica. Por isso descreve os dados
 * concretos que o código toca — token, e-mail da conta, id do calendário —
 * em vez de texto genérico.
 *
 * REVISE com quem cuida do jurídico antes de publicar: o texto reflete o que
 * o sistema faz hoje, não um parecer legal.
 */
const ATUALIZADO_EM = "23 de setembro de 2026";

export default function PoliticaPrivacidade() {
  return (
    <article className="prose-neutral">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Política de Privacidade
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Última atualização: {ATUALIZADO_EM}
      </p>

      <Secao titulo="Quem somos">
        <P>
          O {brand.productName} é um sistema interno de gestão operado por{" "}
          {brand.legalName} e usado pela equipe do estúdio para organizar
          entregas, agenda, orçamentos e galerias de clientes. O acesso é
          restrito a pessoas com conta criada pela administração.
        </P>
      </Secao>

      <Secao titulo="Dados que coletamos">
        <P>Coletamos apenas o necessário para o sistema funcionar:</P>
        <Lista
          itens={[
            "Dados de conta no sistema: nome de usuário e credenciais de acesso.",
            "Conteúdo de trabalho: entregas, tarefas, orçamentos, clientes e arquivos que a equipe cadastra.",
            "Dados do Google, quando você conecta sua conta: descritos na seção seguinte.",
          ]}
        />
      </Secao>

      <Secao titulo="Dados obtidos do Google">
        <P>
          A conexão com o Google é opcional e parte sempre de uma ação sua,
          dentro do sistema. São dois usos independentes:
        </P>

        <h3 className="mt-4 text-sm font-semibold text-neutral-900">
          Google Agenda
        </h3>
        <P>
          Escopo solicitado:{" "}
          <Codigo>https://www.googleapis.com/auth/calendar</Codigo>.
        </P>
        <P>
          Usamos para criar e atualizar, na sua agenda principal, os eventos
          correspondentes às entregas que têm data marcada no sistema. Só
          escrevemos eventos originados no sistema; não lemos, alteramos nem
          armazenamos os seus outros compromissos.
        </P>
        <P>Do seu Google, guardamos em banco de dados apenas:</P>
        <Lista
          itens={[
            "o token de acesso e o token de atualização, usados para manter a conexão ativa;",
            "o endereço de e-mail da conta conectada, exibido na tela para você saber qual conta está ligada;",
            "o identificador da agenda de destino.",
          ]}
        />

        <h3 className="mt-4 text-sm font-semibold text-neutral-900">
          Google Drive
        </h3>
        <P>
          Escopo solicitado:{" "}
          <Codigo>https://www.googleapis.com/auth/drive.readonly</Codigo>.
        </P>
        <P>
          Usado por uma única conta, a do estúdio, para listar e exibir os
          arquivos das pastas que a própria equipe indica ao montar a galeria
          de um cliente. É acesso somente leitura: o sistema não cria, altera
          nem apaga nada no Drive. Membros da equipe não conectam o Drive.
        </P>
      </Secao>

      <Secao titulo="Uso limitado dos dados do Google">
        <P>
          O uso que o {brand.name} faz das informações recebidas das APIs do
          Google segue a{" "}
          <A href="https://developers.google.com/terms/api-services-user-data-policy">
            Política de Dados do Usuário dos Serviços de API do Google
          </A>
          , incluindo os requisitos de Uso Limitado. Em particular:
        </P>
        <Lista
          itens={[
            "não vendemos esses dados;",
            "não os usamos para publicidade, perfilamento ou qualquer finalidade alheia ao funcionamento do sistema;",
            "não permitimos que pessoas leiam esses dados, salvo com sua autorização expressa, por exigência legal, ou para operações internas de segurança que exijam intervenção humana;",
            "não os transferimos a terceiros, exceto aos provedores de infraestrutura listados abaixo, que os processam apenas para hospedar o sistema.",
          ]}
        />
      </Secao>

      <Secao titulo="Onde os dados ficam">
        <P>
          O sistema é hospedado na Vercel e os dados ficam em banco de dados
          Supabase. Os dois atuam como operadores: processam os dados em nosso
          nome, para nos prestar o serviço, e não os utilizam para finalidades
          próprias.
        </P>
      </Secao>

      <Secao titulo="Por quanto tempo guardamos">
        <P>
          Os dados de conexão com o Google ficam guardados enquanto a conexão
          existir. Ao desconectar, o registro é apagado do nosso banco. O
          conteúdo de trabalho permanece enquanto for necessário à operação do
          estúdio.
        </P>
      </Secao>

      <Secao titulo="Como revogar o acesso">
        <P>
          Você pode desfazer a conexão a qualquer momento, por dois caminhos
          independentes:
        </P>
        <Lista
          itens={[
            "dentro do sistema, em Minha Agenda, no botão de desconectar;",
            "na sua conta Google, em myaccount.google.com/permissions, removendo o acesso do aplicativo.",
          ]}
        />
        <P>
          Revogar pelo Google interrompe a sincronização imediatamente. Os
          eventos já criados na sua agenda continuam lá e são seus; apague-os
          pelo próprio Google Agenda se quiser.
        </P>
      </Secao>

      <Secao titulo="Seus direitos">
        <P>
          Nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018), você
          pode solicitar confirmação de tratamento, acesso, correção,
          portabilidade, eliminação dos dados e informação sobre
          compartilhamento. Para exercer qualquer um desses direitos, use o
          canal de contato abaixo.
        </P>
      </Secao>

      <Secao titulo="Contato">
        <P>
          Dúvidas sobre esta política ou sobre o tratamento dos seus dados:{" "}
          {brand.contactUrl ? (
            <A href={brand.contactUrl}>fale com {brand.legalName}</A>
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

function Codigo({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs break-all text-neutral-800">
      {children}
    </code>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
    >
      {children}
    </a>
  );
}
