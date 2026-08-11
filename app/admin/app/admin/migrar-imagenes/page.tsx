import { requireAdmin } from "@/lib/auth";
import { ImageMigrationPanel } from "@/components/image-migration-panel";

export default async function MigrateImagesPage() {
  await requireAdmin();

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <ImageMigrationPanel />
    </main>
  );
}
