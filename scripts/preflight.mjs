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

const missing = required.filter(key => !process.env[key]);

if (missing.length) {
  console.error("\nFaltan variables obligatorias:");
  missing.forEach(key => console.error(`- ${key}`));
  process.exit(1);
}

console.log("Preflight correcto: variables principales presentes.");
