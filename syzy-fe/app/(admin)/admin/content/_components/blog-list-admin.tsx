"use client";

import { useBlogs, type Blog } from "@/features/content/hooks/use-blogs";
import { apiClient } from "@/lib/kubb";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TiptapEditor } from "@/components/shared/editor/tiptap-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Loader2, Star, Pencil, Plus, ImagePlus, Calendar } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function BlogListAdmin() {
  const { blogs, loading, hasMore, loadMore, loadingMore, fetchBlogs } = useBlogs(10);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const handleDelete = async (blog: Blog) => {
    if (!confirm(`Delete "${blog.title}"?`)) return;
    setDeleting(blog.id);
    try {
      await apiClient.delete(`/api/blogs/${blog.id}`);
      toast.success("Blog deleted");
      fetchBlogs();
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => {
    setEditingBlog(null);
    setDialogOpen(true);
  };

  const openEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingBlog(null);
    fetchBlogs();
  };

  return (
    <div>
      {/* Header with Create button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Blog Posts</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No blog posts yet.</p>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create your first post
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border shrink-0">
                  <Image src={blog.imageUrl} alt={blog.title} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{blog.title}</span>
                    {blog.featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{blog.slug}</span>
                    <span className="shrink-0 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(blog)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(blog)}
                  disabled={deleting === blog.id}
                >
                  {deleting === blog.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          ))}
          {hasMore && (
            <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore} className="w-full mt-2">
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Load More
            </Button>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
          </DialogHeader>
          <BlogForm blog={editingBlog} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BlogForm({ blog, onSuccess }: { blog: Blog | null; onSuccess: () => void }) {
  const isEdit = !!blog;
  const [title, setTitle] = useState(blog?.title ?? "");
  const [slug, setSlug] = useState(blog?.slug ?? "");
  const [description, setDescription] = useState(blog?.description ?? "");
  const [body, setBody] = useState(blog?.body ?? "");
  const [featured, setFeatured] = useState(blog?.featured ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(blog?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEdit) setSlug(slugify(value));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || !description || !body) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!isEdit && !imageFile) {
      toast.error("Please select a cover image");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = blog?.imageUrl ?? "";
      if (imageFile) {
        const result = await uploadToCloudinary(imageFile);
        imageUrl = result.url;
      }

      if (isEdit) {
        await apiClient.patch(`/api/blogs/${blog.id}`, {
          title, slug, description, body, imageUrl, featured,
        });
        toast.success("Blog updated!");
      } else {
        await apiClient.post("/api/blogs", {
          title, slug, description, body, imageUrl, featured,
        });
        toast.success("Blog created!");
      }

      onSuccess();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to save blog";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Blog post title" />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-friendly-slug" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
            <ImagePlus className="w-4 h-4" />
            <span className="text-sm">{imageFile ? "Change Image" : isEdit ? "Change Image" : "Select Image"}</span>
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </label>
          {imagePreview && (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Body</Label>
        <TiptapEditor content={body} onChange={setBody} placeholder="Write your blog post content..." />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={featured} onCheckedChange={setFeatured} />
        <Label>Featured post</Label>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {isEdit ? "Save Changes" : "Create Blog Post"}
      </Button>
    </form>
  );
}
