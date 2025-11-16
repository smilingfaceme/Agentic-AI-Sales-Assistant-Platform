-- public.roles schema
create table if not exists public.roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  permissions json not null,
  created_at timestamp with time zone not null default now(),
  constraint roles_pkey primary key (id)
) TABLESPACE pg_default;

-- public.companies schema
create table if not exists public.companies (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  schema_name text not null default ''::text,
  active boolean not null default false,
  created_at timestamp with time zone not null default now(),
  delete boolean not null default false,
  constraint companies_pkey primary key (id),
  constraint companies_schema_name_key unique (schema_name)
) TABLESPACE pg_default;

-- public.users schema
create table if not exists public.users (
  id uuid not null default gen_random_uuid (),
  name text not null,
  password text not null,
  email text not null,
  company_id uuid not null,
  invited_by uuid null,
  role uuid not null,
  created_at timestamp with time zone not null default now(),
  active boolean not null default true,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_company_id_fkey foreign KEY (company_id) references companies (id),
  constraint users_role_fkey foreign KEY (role) references roles (id)
) TABLESPACE pg_default;

-- public.invitations schema
create table if not exists public.invitations (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  invited_email text not null,
  invited_by uuid not null,
  role uuid not null,
  status text not null,
  token_hash text not null,
  created_at timestamp with time zone not null default now(),
  constraint invitations_pkey primary key (id),
  constraint invitations_company_id_fkey foreign KEY (company_id) references companies (id),
  constraint invitations_invited_by_fkey foreign KEY (invited_by) references users (id),
  constraint invitations_role_fkey foreign KEY (role) references roles (id)
) TABLESPACE pg_default;

-- public.integrations schema
create table if not exists public.integrations (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  type text not null,
  is_active boolean not null default true,
  phone_number text not null,
  created_at timestamp with time zone not null default now(),
  instance_name text not null,
  phone_number_id text null,
  created_by uuid not null,
  delete boolean not null default false,
  constraint integrations_pkey primary key (id),
  constraint integrations_instance_name_key unique (instance_name),
  constraint integrations_phone_number_key unique (phone_number),
  constraint integrations_company_id_fkey foreign KEY (company_id) references companies (id),
  constraint integrations_created_by_fkey foreign KEY (created_by) references users (id),
  constraint integration_type_check check (
    (
      type = any (array['whatsapp_web'::text, 'whatsapp_api'::text])
    )
  )
) TABLESPACE pg_default;

create view public.users_with_permissions as
select 
  u.id as user_id,
  u.email,
  u.name,
  u.password,
  u.company_id,
  c.active,
  c.name as company_name,
  c.description as company_description,
  r.name as role_name,
  r.id as role_id,
  r.permissions
from public.users u
left join public.companies c on c.id = u.company_id
left join public.roles r on r.id = u.role
where c.delete = false and u.active = true;

create view public.invitation_with_users as
select 
  i.id as id,
  i.company_id,
  c.name as company_name,
  i.invited_email,
  u.name as invited_by,
  i.token_hash,
  r.name as role,
  r.id as role_id,
  i.status,
  i.created_at
from public.invitations i
left join public.roles r on i.role = r.id
left join public.users u on i.invited_by = u.id
left join public.companies c on c.id = i.company_id
where i.status != 'revoked';

create view public.integrations_with_users as
select 
  i.id,
  i.company_id,
  i.type,
  i.is_active,
  i.phone_number,
  i.created_at,
  i.instance_name,
  i.created_by,
  i.delete,
  u.name as created_by_name
from public.integrations i
left join public.users u on i.created_by = u.id;

create table if not exists public.bot_personality (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  bot_name text null,
  bot_prompt text not null,
  sample_response text null,
  length_of_response text not null,
  chatbot_tone text not null,
  prefered_lang text not null,
  use_emojis boolean not null default true,
  use_bullet_points boolean not null default true,
  constraint bot_personality_pkey primary key (id),
  constraint bot_personality_company_id_fkey foreign KEY (company_id) references companies (id)
) TABLESPACE pg_default;

INSERT INTO roles (name, permissions) VALUES ('admin', '{"chat": true, "knowledge": true, "invite": true, "company": true, "integration": true, "conversation": true, "workflow": true}'::jsonb) RETURNING id, name, permissions;
INSERT INTO roles (name, permissions) VALUES ('knowledge_manager', '{"chat": false, "knowledge": true, "invite": false, "company": false, "integration": false, "conversation": false, "workflow": true}'::jsonb) RETURNING id, name, permissions;
INSERT INTO roles (name, permissions) VALUES ('agent', '{"chat": true, "knowledge": false, "invite": false, "company": false, "integration": true, "conversation": true, "workflow": false}'::jsonb) RETURNING id, name, permissions;