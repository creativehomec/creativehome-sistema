#!/usr/bin/env bash
# Wizard de instalação white label.
#
# Guia a criação do projeto no Supabase e na Vercel, escreve o .env.local e
# cria o primeiro usuário admin. Pode ser interrompido e rodado de novo: cada
# passo pergunta antes de sobrescrever.
#
#   bash scripts/setup-white-label.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
step() { printf '\n\033[1;36m▸ %s\033[0m\n' "$1"; }
warn() { printf '\033[33m%s\033[0m\n' "$1"; }
ok()   { printf '\033[32m✓ %s\033[0m\n' "$1"; }

ask() { # ask VAR "pergunta" ["default"]
  local __var="$1" __prompt="$2" __default="${3:-}" __answer
  if [ -n "$__default" ]; then
    read -r -p "$__prompt [$__default]: " __answer
    __answer="${__answer:-$__default}"
  else
    read -r -p "$__prompt: " __answer
  fi
  printf -v "$__var" '%s' "$__answer"
}

pause() { read -r -p "Pressione Enter quando terminar... " _; }

bold "Instalação white label"
echo "Este wizard escreve $ENV_FILE e prepara o banco. Nada é enviado pra fora."

if [ -f "$ENV_FILE" ]; then
  warn "$ENV_FILE já existe."
  ask OVERWRITE "Sobrescrever? (s/N)" "N"
  case "$OVERWRITE" in
    s|S) : ;;
    *) echo "Mantendo o arquivo atual. Saindo."; exit 0 ;;
  esac
fi

# ---------------------------------------------------------------- 1. marca
step "1/6 — Identidade da marca"
ask BRAND_NAME "Nome curto da marca (aparece no logo)" "CreativeHome"
ask BRAND_LEGAL "Nome por extenso (rodapé de propostas)" "$BRAND_NAME"
ask BRAND_PRODUCT "Nome do produto (aba do navegador)" "Guia de Captação"
ask BRAND_DESC "Descrição curta" "Guias de gravação: roteiros, referências e checklist por projeto."
ask BRAND_CONTACT "Link de contato dos pacotes (ex: https://wa.me/55...)" ""
echo
echo "Cores da marca: edite as variáveis --brand-* em app/globals.css depois."

# ------------------------------------------------------------- 2. supabase
step "2/6 — Supabase do cliente"
cat <<'TXT'
No navegador, logado na conta DO CLIENTE:
  1. supabase.com/dashboard > New project (região South America / São Paulo).
  2. Guarde a senha do banco que ele gera.
  3. SQL Editor > New query > cole o conteúdo de supabase/setup.sql > Run.
  4. Storage > New bucket > nome "guide-references" > marque Public.
  5. Project Settings > API > copie Project URL e a service_role key.
TXT
pause
ask SUPABASE_URL "Project URL (https://xxxx.supabase.co)"
ask SUPABASE_KEY "service_role key"

# --------------------------------------------------------------- 3. google
step "3/6 — Google OAuth (Drive das galerias + Agenda do backlog)"
cat <<'TXT'
Opcional — pule com Enter se o cliente não usa galeria via Drive nem agenda.
  1. console.cloud.google.com > novo projeto na conta do cliente.
  2. APIs & Services > Library > ative "Google Drive API" e "Google Calendar API".
  3. Credentials > Create credentials > OAuth client ID > Web application.
  4. Authorized redirect URIs: adicione uma entrada por ambiente, ex:
       http://localhost:3100/api/drive/oauth/callback
       https://SEU-DOMINIO/api/drive/oauth/callback
TXT
pause
ask GOOGLE_ID "GOOGLE_CLIENT_ID" ""
ask GOOGLE_SECRET "GOOGLE_CLIENT_SECRET" ""
ask GOOGLE_REDIRECT "GOOGLE_OAUTH_REDIRECT_URI" "http://localhost:3100/api/drive/oauth/callback"

# ------------------------------------------------------------------ 4. env
step "4/6 — Escrevendo .env.local"
ADMIN_SECRET="$(openssl rand -hex 32)"
cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_BRAND_NAME=$BRAND_NAME
NEXT_PUBLIC_BRAND_LEGAL_NAME=$BRAND_LEGAL
NEXT_PUBLIC_BRAND_PRODUCT_NAME=$BRAND_PRODUCT
NEXT_PUBLIC_BRAND_DESCRIPTION=$BRAND_DESC
NEXT_PUBLIC_BRAND_CONTACT_URL=$BRAND_CONTACT
NEXT_PUBLIC_BRAND_DISPLAY_FONT=

ADMIN_PASSWORD=$ADMIN_SECRET

SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY

GOOGLE_CLIENT_ID=$GOOGLE_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_SECRET
GOOGLE_OAUTH_REDIRECT_URI=$GOOGLE_REDIRECT
EOF
chmod 600 "$ENV_FILE"
ok ".env.local escrito (ADMIN_PASSWORD gerado aleatório — é só a chave que assina o cookie)"

# ------------------------------------------------------- 5. usuário admin
step "5/6 — Primeiro usuário admin"
ask ADMIN_USER "Nome de usuário do admin" "admin"
read -r -s -p "Senha do admin: " ADMIN_PASS; echo
if [ -z "$ADMIN_PASS" ]; then
  warn "Senha vazia — pulando. Crie o usuário depois (ver README)."
else
  HASH="$(ADMIN_PASS="$ADMIN_PASS" node -e "
const c = require('crypto').webcrypto;
const hex = b => Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
(async () => {
  const salt = c.getRandomValues(new Uint8Array(16));
  const key = await c.subtle.importKey('raw', new TextEncoder().encode(process.env.ADMIN_PASS), 'PBKDF2', false, ['deriveBits']);
  const bits = await c.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  console.log('100000:' + hex(salt.buffer) + ':' + hex(bits));
})();
")"
  echo
  echo "Rode este SQL no SQL Editor do Supabase:"
  echo
  printf "  insert into users (username, password_hash, role)\n  values ('%s', '%s', 'admin');\n" "$ADMIN_USER" "$HASH"
  echo
  pause
fi

# ---------------------------------------------------------------- 6. vercel
step "6/6 — Deploy na Vercel do cliente"
if command -v vercel >/dev/null 2>&1; then
  cat <<'TXT'
A CLI da Vercel está instalada. Sequência:
  vercel login          # entre na conta DO CLIENTE
  vercel link           # cria/associa o projeto
  vercel env pull       # confere
  vercel --prod         # publica
TXT
  ask RUN_VERCEL "Rodar 'vercel login' agora? (s/N)" "N"
  case "$RUN_VERCEL" in s|S) vercel login ;; esac
else
  warn "CLI da Vercel não encontrada. Instale com: npm i -g vercel"
fi

echo
echo "Depois de linkar, suba as variáveis de ambiente (Production):"
while IFS='=' read -r k v; do
  [ -z "$k" ] && continue
  case "$k" in \#*) continue ;; esac
  echo "  vercel env add $k production"
done < "$ENV_FILE"
echo
warn "Na Vercel, GOOGLE_OAUTH_REDIRECT_URI precisa ser a URL de produção —"
warn "e essa mesma URL tem que estar registrada no OAuth Client do Google."

echo
ok "Setup local pronto. Rode: npm install && npm run dev"
