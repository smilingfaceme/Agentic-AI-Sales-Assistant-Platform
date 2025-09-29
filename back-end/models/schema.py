# public.companies schema
PUBLIC_COMPANIES_TABLE = """create table if not exists public.companies (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  schema_name text not null default ''::text,
  active boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint companies_pkey primary key (id),
  constraint companies_schema_name_key unique (schema_name)
) TABLESPACE pg_default;"""

# public.roles schema
PUBLIC_ROLES_TABLE = """create table if not exists public.roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  permissions json not null,
  created_at timestamp with time zone not null default now(),
  constraint roles_pkey primary key (id)
) TABLESPACE pg_default;"""

# public.users schema
PUBLIC_USERS_TABLE = """create table if not exists public.users (
  id uuid not null default gen_random_uuid (),
  name text not null,
  password text not null,
  email text not null,
  company_id uuid not null,
  invited_by uuid null,
  role text not null,
  created_at timestamp with time zone not null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_company_id_fkey foreign KEY (company_id) references companies (id)
) TABLESPACE pg_default;"""

# public.invitations schema
PUBLIC_INVITATIONS_TABLE = """create table if not exists public.invitations (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  invited_email text not null,
  invited_by uuid not null,
  token_hash text not null,
  role uuid not null,
  status text not null,
  created_at timestamp with time zone not null default now(),
  constraint invitations_pkey primary key (id),
  constraint invitations_company_id_fkey foreign KEY (company_id) references companies (id),
  constraint invitations_invited_by_fkey foreign KEY (invited_by) references users (id),
  constraint invitations_role_fkey foreign KEY (role) references roles (id)
) TABLESPACE pg_default;"""