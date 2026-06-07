import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

interface CategoryGridProps {
  categories: Category[];
}

const colorMap: Record<number, string> = {
  0: "from-blue-400 to-indigo-500",
  1: "from-green-400 to-teal-500",
  2: "from-purple-400 to-pink-500",
  3: "from-orange-400 to-red-500",
  4: "from-cyan-400 to-blue-500",
  5: "from-yellow-400 to-orange-500",
  6: "from-pink-400 to-rose-500",
  7: "from-emerald-400 to-green-500",
  8: "from-violet-400 to-purple-500",
  9: "from-amber-400 to-yellow-500",
  10: "from-sky-400 to-blue-500",
  11: "from-rose-400 to-pink-500",
  12: "from-lime-400 to-green-500",
  13: "from-fuchsia-400 to-pink-500",
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          href={`/directory/${cat.id}`}
          className="group block"
        >
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div
              className={`aspect-[3/1] bg-gradient-to-r ${colorMap[i % Object.keys(colorMap).length]} relative flex items-center justify-center p-6`}
            >
              <div className="text-white">
                <div className="text-4xl mb-2">{cat.icon}</div>
                <div className="text-sm opacity-80">{cat.count} resources</div>
              </div>
              <Badge
                variant="secondary"
                className="absolute top-4 right-4 bg-white/20 text-white border-0"
              >
                Browse
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">
                {cat.name}
              </CardTitle>
              <CardDescription>{cat.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
