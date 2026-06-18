/**
 * AuthorInfo - 作者信息组件（E-E-A-T 优化）
 * 显示作者名 + 头像 + 简介，配合 author JSON-LD schema
 */
interface AuthorInfoProps {
  authorName?: string;
  authorUrl?: string;
  datePublished?: string;
  dateModified?: string;
  showSchema?: boolean;
}

export function AuthorInfo({
  authorName = "Craftisle Team",
  authorUrl = "https://craftisle.com/about/team",
  datePublished,
  dateModified,
  showSchema = true,
}: AuthorInfoProps) {
  // author JSON-LD schema
  const authorJsonLd = showSchema
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: authorName,
        url: authorUrl,
      }
    : null;

  // date JSON-LD schema
  const dateJsonLd = showSchema && (datePublished || dateModified)
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        datePublished: datePublished || undefined,
        dateModified: dateModified || datePublished || undefined,
      }
    : null;

  return (
    <>
      {/* author JSON-LD */}
      {authorJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd) }}
        />
      )}

      {/* date JSON-LD */}
      {dateJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dateJsonLd) }}
        />
      )}

      {/* Author Info UI */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {authorName.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-foreground">{authorName}</p>
          {(datePublished || dateModified) && (
            <p className="text-xs">
              {datePublished && <span>Published: {datePublished}</span>}
              {datePublished && dateModified && <span> · </span>}
              {dateModified && <span>Updated: {dateModified}</span>}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
