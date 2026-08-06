insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public product image access"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "admin product image upload"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy "admin product image update"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy "admin product image delete"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and public.is_admin()
);

create or replace function public.confirm_transfer_payment(
  p_order_id uuid,
  p_reference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado';
  end if;

  update orders
  set
    status = 'paid',
    payment_reference = coalesce(p_reference, payment_reference),
    paid_at = coalesce(paid_at, now())
  where id = p_order_id
    and payment_method = 'transfer';
end;
$$;

revoke all on function public.confirm_transfer_payment from public;
grant execute on function public.confirm_transfer_payment to authenticated, service_role;
