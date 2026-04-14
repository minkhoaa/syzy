"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Search, Loader2, ExternalLink, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useBlogs, type Blog } from "@/features/content/hooks/use-blogs"
import { useArticles, type Article } from "@/features/content/hooks/use-articles"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { LandingFooter } from "@/components/layout/landing-footer"
import { Button } from "@/components/ui/button"

function BlogCard({ post }: { post: Blog }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border mb-3">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-1.5">{post.description}</p>
      <time className="text-xs text-muted-foreground/60">
        {new Date(post.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
    </Link>
  )
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/blog/${article.slug}?type=article`} className="group block">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border mb-3">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* X badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white rounded-full w-7 h-7 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      </div>
      <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-1.5">{article.description}</p>
      <div className="flex items-center gap-2">
        <time className="text-xs text-muted-foreground/60">
          {new Date(article.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <a
          href={article.tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          View on X
        </a>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="block">
      <Skeleton className="aspect-[16/10] rounded-xl mb-3" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <>
      {/* Blog section skeleton */}
      <section className="mb-16 sm:mb-20">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>

      <div className="border-t border-border mb-16 sm:mb-20" />

      {/* Articles section skeleton */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    </>
  )
}

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  const {
    blogs,
    loading: blogsLoading,
    hasMore: blogsHasMore,
    loadMore: loadMoreBlogs,
    loadingMore: blogsLoadingMore,
  } = useBlogs()
  const {
    articles,
    loading: articlesLoading,
    hasMore: articlesHasMore,
    loadMore: loadMoreArticles,
    loadingMore: articlesLoadingMore,
  } = useArticles()

  const loading = blogsLoading || articlesLoading

  const filteredBlogs = useMemo(
    () =>
      blogs.filter(
        (b) =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [blogs, searchQuery]
  )

  const filteredArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [articles, searchQuery]
  )

  return (
    <div className="min-h-screen bg-white dark:bg-black text-foreground font-sans transition-colors duration-500">
      <LandingNavbar />

      <main className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
        {/* Page Header */}
        <div className="flex items-end justify-between mb-12 sm:mb-16">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Blog
            </h1>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg">
              Livestream recaps, updates, and posts from our X account.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {searchOpen && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="bg-neutral-50 dark:bg-neutral-900 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 w-48 sm:w-64 transition-all"
              />
            )}
            <button
              onClick={() => {
                setSearchOpen(!searchOpen)
                if (searchOpen) setSearchQuery("")
              }}
              className="p-2 rounded-lg border border-border hover:border-primary/30 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* ── Section 1: Blog ── */}
            <section className="mb-16 sm:mb-20">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                  <FileText className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Blog
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    News, updates, and insights from the Syzy team.
                  </p>
                </div>
              </div>

              {filteredBlogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-12 border border-dashed border-border rounded-xl">
                  No blog posts found.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBlogs.map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                  {blogsHasMore && !searchQuery && (
                    <div className="flex justify-center mt-8">
                      <Button variant="outline" onClick={loadMoreBlogs} disabled={blogsLoadingMore}>
                        {blogsLoadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Divider */}
            <div className="border-t border-border mb-16 sm:mb-20" />

            {/* ── Section 2: Articles ── */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-foreground">
                  <svg className="w-4.5 h-4.5 text-background" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Articles
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Our latest posts and threads on X.
                  </p>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <p className="text-muted-foreground text-center py-12 border border-dashed border-border rounded-xl">
                  No articles found.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                  {articlesHasMore && !searchQuery && (
                    <div className="flex justify-center mt-8">
                      <Button variant="outline" onClick={loadMoreArticles} disabled={articlesLoadingMore}>
                        {articlesLoadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>

      <LandingFooter />
    </div>
  )
}
