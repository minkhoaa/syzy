"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, ExternalLink, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/kubb"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { LandingFooter } from "@/components/layout/landing-footer"
import { Button } from "@/components/ui/button"
import { TweetEmbed } from "@/components/shared/tweet-embed"
import type { Blog } from "@/features/content/hooks/use-blogs"
import type { Article } from "@/features/content/hooks/use-articles"

/** Unwrap NestJS { success, data } wrapper if present */
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return (payload as Record<string, unknown>).data as T
  }
  return payload as T
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const isArticle = searchParams.get("type") === "article"

  const [blog, setBlog] = useState<Blog | null>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!params.slug) return

    const fetchContent = async () => {
      setLoading(true)
      try {
        if (isArticle) {
          const res = await apiClient.get(`/api/articles/${params.slug}`)
          setArticle(unwrap<Article>(res.data))
        } else {
          const res = await apiClient.get(`/api/blogs/${params.slug}`)
          setBlog(unwrap<Blog>(res.data))
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [params.slug, isArticle])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-foreground font-sans transition-colors">
        <LandingNavbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-foreground font-sans transition-colors">
        <LandingNavbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Not Found</h1>
          <p className="text-muted-foreground mb-8">This post could not be found.</p>
          <Link href="/blog">
            <Button variant="outline">Back to Blog</Button>
          </Link>
        </main>
        <LandingFooter />
      </div>
    )
  }

  // Article view
  if (isArticle && article) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-foreground font-sans transition-colors">
        <LandingNavbar />

        {/* Hero cover image */}
        <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] mt-16">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Blog
              </Link>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <time>
                    {new Date(article.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>Article</span>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20">
          {/* Title + Description + CTA */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
            {article.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {article.description}
            </p>
            <a
              href={article.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors text-sm font-medium whitespace-nowrap shrink-0 self-start"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              View Original Post
            </a>
          </div>

          {/* Embedded tweet — main content */}
          <div className="max-w-xl mx-auto">
            <TweetEmbed tweetUrl={article.tweetUrl} />
          </div>

          <div className="border-t border-border mt-16 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to all articles
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    )
  }

  // Blog post view
  if (blog) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-foreground font-sans transition-colors">
        <LandingNavbar />

        {/* Hero cover image */}
        <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] mt-16">
          <Image
            src={blog.imageUrl}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Blog
              </Link>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <time>
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>Blog</span>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
            {blog.title}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-10">
            {blog.description}
          </p>

          {/* Blog body rendered as HTML (admin-only authored content) */}
          <article
            className="prose prose-lg prose-neutral dark:prose-invert max-w-none font-sans prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-p:text-neutral-600 dark:prose-p:text-neutral-400 prose-p:leading-relaxed prose-strong:text-neutral-900 dark:prose-strong:text-neutral-100 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-neutral-600 dark:prose-li:text-neutral-400 prose-li:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-blockquote:border-l-primary prose-blockquote:text-neutral-500 dark:prose-blockquote:text-neutral-400 prose-hr:border-border prose-img:rounded-2xl prose-img:border prose-img:border-border prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: blog.body }}
          />

          <div className="border-t border-border mt-16 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to all posts
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    )
  }

  return null
}
