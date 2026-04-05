-- ══════════════════════════════════════════════
-- COBI Sourcing OS — Supabase Migration
-- Supabase SQL Editor 에 전체 복사 후 ▶ Run
-- ══════════════════════════════════════════════

-- 1. EVENTS
create table if not exists events (
  id            text primary key,
  workspace_id  text not null,
  title         text not null,
  date          text not null,
  end_date      text,
  cat           text not null default 'other',
  note          text,
  created_at    timestamptz default now()
);

-- 2. SUPPLIERS
create table if not exists suppliers (
  id            text primary key,
  workspace_id  text not null,
  name          text,
  name_ko       text not null,
  city          text,
  country       text default 'CN',
  cat           text default '가구',
  contact       text,
  wechat        text,
  phone         text,
  rating        int  default 3,
  status        text default 'active',
  note          text,
  created_at    timestamptz default now()
);

-- 3. PURCHASE ORDERS
create table if not exists purchase_orders (
  id            text primary key,
  workspace_id  text not null,
  title         text not null,
  supplier_id   text,
  cat           text default '가구',
  qty           text,
  amount        text,
  currency      text default 'CNY',
  stage         text default 'RFQ발송',
  deadline      text,
  note          text,
  created_at    timestamptz default now()
);

-- 4. RLS (Row Level Security) — workspace_id 기반 격리
alter table events          enable row level security;
alter table suppliers       enable row level security;
alter table purchase_orders enable row level security;

-- anon 키로 모든 CRUD 허용 (워크스페이스 코드가 보안 경계)
create policy "workspace_access" on events
  for all using (true) with check (true);

create policy "workspace_access" on suppliers
  for all using (true) with check (true);

create policy "workspace_access" on purchase_orders
  for all using (true) with check (true);

-- 5. 인덱스 (realtime 필터 + 조회 최적화)
create index if not exists idx_events_ws      on events(workspace_id, date);
create index if not exists idx_suppliers_ws   on suppliers(workspace_id);
create index if not exists idx_pos_ws         on purchase_orders(workspace_id, stage);

-- 6. Realtime 활성화
-- Supabase Dashboard → Database → Replication 에서
-- events / suppliers / purchase_orders 테이블 토글 ON 도 해주세요
