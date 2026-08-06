import { NextResponse } from "next/server";

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "BANK_ACCOUNT_HOLDER",
  "BANK_IBAN",
];

export async function GET() {
  const missing = required.filter(key => !process.env[key]);
  return NextResponse.json(
    {
      ready: missing.length === 0,
      missing,
      checkedAt: new Date().toISOString(),
    },
    { status: missing.length === 0 ? 200 : 503 }
  );
}
