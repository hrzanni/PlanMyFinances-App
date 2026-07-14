import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../db/schema'
import type { DrizzleDB } from '../db/client'

/**
 * Banco Postgres em memória (pglite) para testes de service.
 * O schema é criado a partir das definições Drizzle via push manual (DDL mínimo).
 */
export async function createTestDb(): Promise<DrizzleDB> {
  const client = new PGlite()
  const db = drizzle(client, { schema })

  await client.exec(`
    create type tx_type as enum ('receita','despesa');
    create type tx_source as enum ('manual','fixed_expense','pluggy');
    create type charge_status as enum ('pendente','cobrado','pago');
    create type invoice_status as enum ('pendente','pago');
    create type active_status as enum ('active','archived');
    create type connection_status as enum ('connected','error','expired');

    create table users (
      id text primary key,
      name text not null,
      email text not null unique,
      email_verified boolean not null default false,
      image text,
      birth_date date,
      gender text,
      phone text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table categories (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      name text not null,
      type tx_type not null
    );

    create table subcategories (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      category_id uuid not null references categories(id) on delete cascade,
      name text not null
    );

    create table folders (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      name text not null,
      icon text,
      status active_status not null default 'active',
      created_at timestamptz not null default now()
    );

    create table transactions (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      type tx_type not null,
      value numeric(12,2) not null,
      description text,
      category_id uuid references categories(id) on delete set null,
      subcategory_id uuid references subcategories(id) on delete set null,
      folder_id uuid references folders(id) on delete set null,
      source tx_source not null default 'manual',
      external_id text,
      date date not null,
      created_at timestamptz not null default now(),
      constraint tx_value_positive check (value > 0)
    );
    create unique index tx_user_external_unique on transactions (user_id, external_id)
      where external_id is not null;

    create table fixed_expenses (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      name text not null,
      amount numeric(12,2) not null,
      due_day integer not null,
      category_id uuid references categories(id) on delete set null,
      status active_status not null default 'active',
      created_at timestamptz not null default now(),
      constraint fe_amount_positive check (amount > 0),
      constraint fe_due_day_range check (due_day >= 1 and due_day <= 31)
    );

    create table fixed_expense_payments (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      fixed_expense_id uuid not null references fixed_expenses(id) on delete cascade,
      reference_month date not null,
      amount numeric(12,2) not null,
      paid_at date not null,
      transaction_id uuid references transactions(id) on delete set null,
      created_at timestamptz not null default now()
    );
    create unique index fep_expense_month_unique
      on fixed_expense_payments (fixed_expense_id, reference_month);

    create table charges (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      debtor_name text not null,
      description text,
      amount_per_installment numeric(12,2) not null,
      total_installments integer not null,
      amount_paid numeric(12,2) not null default 0,
      due_date date,
      status charge_status not null default 'pendente',
      created_at timestamptz not null default now(),
      constraint charge_paid_le_total check (amount_paid <= amount_per_installment * total_installments),
      constraint charge_installments_min check (total_installments >= 1)
    );

    create table invoices (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      card_name text not null,
      description text,
      amount_per_installment numeric(12,2) not null,
      total_installments integer not null,
      amount_paid numeric(12,2) not null default 0,
      due_date date,
      status invoice_status not null default 'pendente',
      created_at timestamptz not null default now(),
      constraint invoice_paid_le_total check (amount_paid <= amount_per_installment * total_installments),
      constraint invoice_installments_min check (total_installments >= 1)
    );

    create table bank_connections (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      pluggy_item_id text not null,
      institution_name text not null,
      status connection_status not null default 'connected',
      last_synced_at timestamptz,
      consent_expires_at date,
      created_at timestamptz not null default now()
    );
  `)

  return db as unknown as DrizzleDB
}

export async function seedTestUsers(db: DrizzleDB): Promise<{ userA: string; userB: string }> {
  await db.insert(schema.users).values([
    { id: 'user-a', name: 'Usuário A', email: 'a@test.dev' },
    { id: 'user-b', name: 'Usuário B', email: 'b@test.dev' },
  ])
  return { userA: 'user-a', userB: 'user-b' }
}
