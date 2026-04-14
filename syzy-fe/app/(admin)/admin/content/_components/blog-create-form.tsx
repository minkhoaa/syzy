"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TiptapEditor } from "@/components/shared/editor/tiptap-editor";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { apiClient } from "@/lib/kubb";
import { toast } from "sonner";
import { Loader2, ImagePlus } from "lucide-react";
import Image from "next/image";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function BlogCreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [featured, setFeatured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(slugify(value));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !description || !body || !imageFile) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // Upload image to Cloudinary
      const { url: imageUrl } = await uploadToCloudinary(imageFile);

      // Create blog post
      await apiClient.post("/api/blogs", {
        title,
        slug,
        description,
        body,
        imageUrl,
        featured,
      });

      toast.success("Blog post created!");
      // Reset form
      setTitle("");
      setSlug("");
      setDescription("");
      setBody("");
      setFeatured(false);
      setImageFile(null);
      setImagePreview(null);
      onSuccess?.();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to create blog post";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="blog-title">Title</Label>
          <Input
            id="blog-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Blog post title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="blog-slug">Slug</Label>
          <Input
            id="blog-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-friendly-slug"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="blog-description">Description</Label>
        <Input
          id="blog-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the blog post"
        />
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
            <ImagePlus className="w-4 h-4" />
            <span className="text-sm">{imageFile ? "Change Image" : "Select Image"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
          {imagePreview && (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Body — Tiptap Editor */}
      <div className="space-y-2">
        <Label>Body</Label>
        <TiptapEditor
          content={body}
          onChange={setBody}
          placeholder="Write your blog post content..."
        />
      </div>

      {/* Featured toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="blog-featured"
          checked={featured}
          onCheckedChange={setFeatured}
        />
        <Label htmlFor="blog-featured">Featured post</Label>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Create Blog Post
      </Button>
    </form>
  );
}
