import { requireAdmin } from "@/lib/auth";
import { AdminCouponForm } from "@/components/admin-coupon-form";
import { toggleCoupon } from "@/app/admin/cupones/actions";

export default async function CouponsPage() {
  const { supabase } = await requireAdmin();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at",{ascending:false});

  return (
    <main className="container" style={{padding:"46px 0 80px"}}>
      <span style={{color:"#d6a6ff",fontWeight:800}}>ADMINISTRACIÓN</span>
      <h1>Cupones</h1>
      <AdminCouponForm />

      <section style={{display:"grid",gap:12,marginTop:24}}>
        {(coupons ?? []).map(coupon=>(
          <article key={coupon.id} className="card" style={{padding:16,display:"grid",gridTemplateColumns:"1fr auto auto",gap:16,alignItems:"center"}}>
            <div>
              <strong>{coupon.code}</strong>
              <div className="muted">
                {coupon.type==="percent" ? `${coupon.value}%` : `${Number(coupon.value).toFixed(2)} €`}
                {" · "}Usos: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""}
              </div>
            </div>
            <span style={{color:coupon.active?"#79f2ad":"#ffd275"}}>{coupon.active?"Activo":"Inactivo"}</span>
            <form action={async()=>{"use server";await toggleCoupon(coupon.id,!coupon.active)}}>
              <button className="btn-secondary">{coupon.active?"DESACTIVAR":"ACTIVAR"}</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
