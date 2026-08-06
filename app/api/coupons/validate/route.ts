import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const { code, subtotal } = Schema.parse(await request.json());
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("apply_coupon", {
      p_code: code,
      p_subtotal: subtotal,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cupón no válido" },
      { status: 400 }
    );
  }
}
