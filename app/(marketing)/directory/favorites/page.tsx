import { FavoritesClient } from "@/components/resources/favorites-client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "My Favorite Resources | Craftisle Directory",
  description: "Your saved and bookmarked free tools and resources from the Craftisle directory.",
  canonical: "https://craftisle.app/directory/favorites",
  noIndex: true, // 收藏页是个人化的，不适合被索引
});

export default function FavoritesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ⭐ My Favorites
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Resources you've bookmarked. Stored locally on your device.
            </p>
          </div>
        </div>
      </section>

      {/* Favorites list (client component) */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FavoritesClient />
        </div>
      </section>
    </div>
  );
}
