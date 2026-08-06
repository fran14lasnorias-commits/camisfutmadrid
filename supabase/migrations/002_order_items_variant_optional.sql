alter table order_items
  alter column product_id drop not null;

alter table order_items
  add column if not exists product_name_snapshot text,
  add column if not exists product_slug_snapshot text,
  add column if not exists size_snapshot text;
