create or replace function public.create_order_and_reserve_stock_v2(
  p_number text,
  p_user_id uuid,
  p_total_eur numeric,
  p_supplier_cost_usd numeric,
  p_payment_method text,
  p_shipping_method text,
  p_shipping_address jsonb,
  p_items jsonb,
  p_discount_code text,
  p_discount_eur numeric,
  p_estimated_profit_eur numeric,
  p_exchange_rate_usd_eur numeric,
  p_payment_fee_eur numeric,
  p_packaging_cost_eur numeric,
  p_customer_shipping_cost_eur numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
begin
  insert into orders (
    number,user_id,status,total_eur,supplier_cost_usd,
    payment_method,shipping_method,shipping_address,
    discount_code,discount_eur,estimated_profit_eur,
    exchange_rate_usd_eur,payment_fee_eur,
    packaging_cost_eur,customer_shipping_cost_eur
  )
  values (
    p_number,p_user_id,'pending',p_total_eur,p_supplier_cost_usd,
    p_payment_method,p_shipping_method,p_shipping_address,
    p_discount_code,p_discount_eur,p_estimated_profit_eur,
    p_exchange_rate_usd_eur,p_payment_fee_eur,
    p_packaging_cost_eur,p_customer_shipping_cost_eur
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'productId','')::uuid;
    v_quantity := coalesce((v_item->>'quantity')::int,1);

    select id into v_variant_id
    from product_variants
    where product_id = v_product_id
      and size = v_item->>'size'
    for update;

    if v_variant_id is null then
      raise exception 'No existe la talla % para el producto %', v_item->>'size', v_item->>'name';
    end if;

    update product_variants
    set stock = stock - v_quantity
    where id = v_variant_id
      and stock >= v_quantity;

    if not found then
      raise exception 'Stock insuficiente para % talla %', v_item->>'name', v_item->>'size';
    end if;

    insert into order_items (
      order_id,product_id,variant_id,quantity,unit_price_eur,
      personalization_name,personalization_number,patch,
      supplier_unit_cost_usd,product_name_snapshot,
      product_slug_snapshot,size_snapshot
    )
    values (
      v_order_id,v_product_id,v_variant_id,v_quantity,
      (v_item->>'unitPriceEur')::numeric,
      nullif(v_item->>'personalizationName',''),
      nullif(v_item->>'personalizationNumber',''),
      nullif(v_item->>'patch',''),
      (v_item->>'supplierUnitCostUsd')::numeric,
      v_item->>'name',v_item->>'slug',v_item->>'size'
    );
  end loop;

  return jsonb_build_object('id',v_order_id,'number',p_number);
end;
$$;

revoke all on function public.create_order_and_reserve_stock_v2 from public;
grant execute on function public.create_order_and_reserve_stock_v2 to authenticated, anon, service_role;
