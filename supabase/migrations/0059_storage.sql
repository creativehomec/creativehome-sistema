-- Armazenamento: onde o material do estúdio mora (SSDs, nuvem) e o que existe
-- em cada lugar. Tamanhos em GB decimal (1 TB = 1000 GB). Só o servidor
-- (service role) lê e escreve: RLS ligada e nenhuma policy.
create table if not exists storage_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'estudio' check (role in ('estudio', 'backup', 'entrega')),
  capacity_gb numeric not null check (capacity_gb > 0),
  used_gb numeric not null default 0 check (used_gb >= 0),
  limit_percent integer not null default 80 check (limit_percent between 1 and 100),
  -- Preenchidos pelo app do Mac, que lê os discos sozinho. `device_key` nulo = espaço cadastrado à mão.
  device_key text unique,
  connected boolean not null default true,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Um material (pasta de primeiro nível do disco) e os lugares onde há cópia.
create table if not exists storage_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size_gb numeric not null default 0 check (size_gb >= 0),
  location_ids uuid[] not null default '{}',
  -- Subpastas por disco: { "<id do espaço>": [{ "name": "...", "sizeGb": 1.2 }] }.
  subfolders jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table storage_locations enable row level security;
alter table storage_items enable row level security;
