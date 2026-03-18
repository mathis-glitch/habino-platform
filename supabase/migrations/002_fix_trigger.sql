-- Fix: handle_new_user trigger — skip insert if tenant_id is null
-- Run in: Supabase Dashboard → SQL Editor

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := (new.raw_user_meta_data->>'tenant_id')::uuid;

  -- If no tenant_id provided, fall back to the 'demo' tenant
  if v_tenant_id is null then
    select id into v_tenant_id from public.tenants where slug = 'demo' limit 1;
  end if;

  -- Only insert if we have a valid tenant
  if v_tenant_id is not null then
    insert into public.users (id, tenant_id, email, full_name, role)
    values (
      new.id,
      v_tenant_id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      coalesce(new.raw_user_meta_data->>'role', 'buyer')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;
