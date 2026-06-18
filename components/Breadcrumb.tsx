"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <nav aria-label="breadcrumb" className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
        <ol className="flex items-center space-x-1">
          {items.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
              {index === items.length - 1 ? (
                <span className="text-gray-900 font-medium">{item.name}</span>
              ) : (
                <Link href={item.url} className="hover:text-blue-600 transition-colors">
                  {index === 0 && <Home className="w-4 h-4 inline mr-1" />}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
