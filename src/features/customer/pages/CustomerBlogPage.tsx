import { useState } from "react";
import { Clock, Tag } from "lucide-react";
import { BLOG_POSTS } from "@/features/customer/fixtures/blogFixtures";
import type { BlogPost } from "@/features/customer/fixtures/blogFixtures";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ALL_CATEGORIES = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PostDetail({
  post,
  onBack,
}: {
  post: BlogPost;
  onBack: () => void;
}) {
  return (
    <article aria-labelledby="post-title">
      <Button
        variant="ghost"
        className={cn(
          "mb-6 rounded-full text-[#A37E6B] hover:bg-[#F4EDE7]",
          customerTheme.focusRing,
        )}
        onClick={onBack}
        aria-label="Back to blog list"
      >
        ← Back to Blog
      </Button>

      <div className={cn(customerTheme.card, "overflow-hidden")}>
        {/* Cover placeholder */}
        <div
          className="flex h-48 items-center justify-center bg-[#F4EDE7] sm:h-64"
          role="img"
          aria-label={post.coverAlt}
        >
          <span className="text-4xl text-[#A37E6B]" aria-hidden="true">
            ✦
          </span>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-[#F4EDE7] px-3 py-1 text-xs font-semibold",
                customerTheme.primaryText,
              )}
            >
              <Tag className="h-3 w-3" aria-hidden="true" />
              {post.category}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                customerTheme.mutedText,
              )}
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              {post.readingTimeMin} min read
            </span>
          </div>

          <h1
            id="post-title"
            className="mb-3 text-2xl font-bold text-[#2F2925] sm:text-3xl"
          >
            {post.title}
          </h1>

          <p className={cn("mb-8 text-sm", customerTheme.mutedText)}>
            By {post.author} · {formatDate(post.publishedAt)}
          </p>

          <div className="space-y-5">
            {post.body.map((paragraph, i) => (
              <p
                key={i}
                className={cn("leading-relaxed", customerTheme.mutedText)}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function PostCard({
  post,
  onSelect,
}: {
  post: BlogPost;
  onSelect: (post: BlogPost) => void;
}) {
  return (
    <article
      className={cn(customerTheme.softCard, "flex flex-col overflow-hidden")}
      aria-labelledby={`post-card-${post.id}`}
    >
      {/* Cover placeholder */}
      <div
        className="flex h-36 items-center justify-center bg-[#F4EDE7]"
        role="img"
        aria-label={post.coverAlt}
        aria-hidden="true"
      >
        <span className="text-3xl text-[#A37E6B]">✦</span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-[#F4EDE7] px-2.5 py-0.5 text-xs font-semibold",
              customerTheme.primaryText,
            )}
          >
            {post.category}
          </span>
          <span className={cn("inline-flex items-center gap-1 text-xs", customerTheme.mutedText)}>
            <Clock className="h-3 w-3" aria-hidden="true" />
            {post.readingTimeMin} min
          </span>
        </div>

        <h2
          id={`post-card-${post.id}`}
          className="mb-2 font-semibold text-[#2F2925]"
        >
          {post.title}
        </h2>

        <p className={cn("mb-4 flex-1 text-sm leading-relaxed", customerTheme.mutedText)}>
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <p className={cn("text-xs", customerTheme.mutedText)}>
            {formatDate(post.publishedAt)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full text-[#A37E6B] hover:bg-[#F4EDE7]",
              customerTheme.focusRing,
            )}
            onClick={() => onSelect(post)}
            aria-label={`Read: ${post.title}`}
          >
            Read →
          </Button>
        </div>
      </div>
    </article>
  );
}

export function CustomerBlogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const filtered = activeCategory
    ? BLOG_POSTS.filter((p) => p.category === activeCategory)
    : BLOG_POSTS;

  if (selectedPost) {
    return (
      <PostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section aria-labelledby="blog-heading">
        <h1
          id="blog-heading"
          className="mb-2 text-3xl font-bold tracking-tight text-[#2F2925]"
        >
          Style &amp; Stories
        </h1>
        <p className={cn("text-lg", customerTheme.mutedText)}>
          Ideas on fashion, technology, and building a wardrobe you love.
        </p>
      </section>

      {/* Category filters */}
      <nav aria-label="Blog categories">
        <ul className="flex flex-wrap gap-2" role="list">
          <li>
            <button
              type="button"
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                customerTheme.focusRing,
                activeCategory === null
                  ? "border-[#A37E6B] bg-[#A37E6B] text-white"
                  : "border-[#E4DCD1] text-[#6F625B] hover:border-[#A37E6B] hover:text-[#A37E6B]",
              )}
              onClick={() => setActiveCategory(null)}
              aria-pressed={activeCategory === null}
            >
              All
            </button>
          </li>
          {ALL_CATEGORIES.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  customerTheme.focusRing,
                  activeCategory === cat
                    ? "border-[#A37E6B] bg-[#A37E6B] text-white"
                    : "border-[#E4DCD1] text-[#6F625B] hover:border-[#A37E6B] hover:text-[#A37E6B]",
                )}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Post grid */}
      {filtered.length === 0 ? (
        <p className={cn("py-12 text-center", customerTheme.mutedText)}>
          No posts in this category yet.
        </p>
      ) : (
        <ul
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Blog posts"
        >
          {filtered.map((post) => (
            <li key={post.id}>
              <PostCard post={post} onSelect={setSelectedPost} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
