"use client";

import { RequireAdmin } from "@/components/auth/require-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogListAdmin } from "./_components/blog-list-admin";
import { ArticleListAdmin } from "./_components/article-list-admin";
import { FileText, Newspaper } from "lucide-react";

export default function AdminContentPage() {
  return (
    <RequireAdmin>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage blog posts, articles, and admins
          </p>
        </div>

        <Tabs defaultValue="blogs" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="blogs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Blogs
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Articles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blogs">
            <BlogListAdmin />
          </TabsContent>

          <TabsContent value="articles">
            <ArticleListAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </RequireAdmin>
  );
}
