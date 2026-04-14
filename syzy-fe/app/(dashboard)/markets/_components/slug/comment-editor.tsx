"use client";

import React, { useState, useRef } from "react";
import {
  Send,
  ImagePlus,
  X,
  Smile,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJI_LIST = [
  "👍", "👎", "🔥", "🚀", "💎", "🐻", "🐂", "📈", "📉", "💰",
  "🎯", "⚡", "🤔", "😂", "❤️", "👀", "🙌", "💪", "🎉", "⭐",
  "🌙", "☀️", "🏆", "💯", "🤝", "😎", "🫡", "🤑", "😱", "🧠",
];

interface CommentEditorProps {
  onSubmit: (content: string, images: File[]) => Promise<void>;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  isConnected: boolean; // New prop to check wallet connection
  onLogin?: () => void; // Callback to trigger login
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  onCancel?: () => void;
}

export function CommentEditor({
  onSubmit,
  isSubmitting,
  isAuthenticated,
  isConnected,
  onLogin,
  placeholder = "Write a comment...",
  autoFocus = false,
  compact = false,
  onCancel,
}: CommentEditorProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    // If connected but not authenticated, trigger login first
    if (isConnected && !isAuthenticated) {
      onLogin?.();
      return;
    }

    const trimmed = content.trim();
    if (!trimmed && images.length === 0) return;
    await onSubmit(trimmed, images);
    setContent("");
    setImages([]);
    setImagePreviews([]);
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ... (image handling code remains same) ...

  // ... (image handling code remains same) ...

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validImages = files.filter((f) => f.type.startsWith("image/"));
    if (validImages.length === 0) return;

    // Max 5 images total
    const remaining = 5 - images.length;
    const toAdd = validImages.slice(0, remaining);

    setImages((prev) => [...prev, ...toAdd]);

    // Generate previews
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      // Restore cursor after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  // Show placeholder ONLY if NOT connected
  if (!isConnected) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/10 to-transparent p-6 text-center backdrop-blur-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Connect your wallet to participate in the discussion
        </p>
        {/* Optionally add a Connect Wallet button here or rely on AppHeader */}
      </div>
    );
  }

  // If connected (even if not authenticated), show editor
  return (
    <div className="group/editor relative rounded-3xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-black/50 backdrop-blur-xl overflow-hidden transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-[0_8px_32px_0_rgba(255,120,24,0.25)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 dark:before:from-white/5 before:to-transparent before:pointer-events-none">
      {/* Focus glow effect */}
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-primary/30 to-secondary/30 opacity-0 group-focus-within/editor:opacity-100 blur-md transition-opacity duration-300 pointer-events-none" />

      {/* Glass texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      {/* Inner glow */}
      <div className="absolute inset-0 rounded-3xl shadow-[inset_0_0_60px_rgba(255,255,255,0.05)] pointer-events-none" />
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={compact ? 2 : 3}
        className={cn(
          "relative z-10 w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm outline-none placeholder:text-muted-foreground/60 transition-colors",
          compact && "text-sm"
        )}
        disabled={isSubmitting}
      />

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="relative z-10 px-4 pb-2 flex gap-2 flex-wrap">
          {imagePreviews.map((preview, i) => (
            <div key={i} className="relative group">
              <img
                src={preview}
                alt={`Preview ${i + 1}`}
                className="h-16 w-16 object-cover rounded-xl border-2 border-border/50 shadow-md group-hover:border-primary/50 transition-all"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110 active:scale-95"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojis && (
        <div className="relative z-10 px-4 pb-2 animate-fade-scale-in">
          <div className="flex flex-wrap gap-1.5 p-2.5 bg-gradient-to-br from-muted/30 to-muted/20 rounded-xl border border-border/50 backdrop-blur-sm shadow-inner">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all text-lg shadow-sm"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between px-3 py-2.5 border-t border-border/30 bg-gradient-to-br from-muted/10 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all hover:scale-110 active:scale-95"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 5 || isSubmitting}
            title="Add image"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all hover:scale-110 active:scale-95",
              showEmojis && "text-primary bg-primary/15 shadow-md"
            )}
            onClick={() => setShowEmojis(!showEmojis)}
            disabled={isSubmitting}
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs gap-1.5 font-bold hover:scale-105 active:scale-95 transition-transform shadow-md"
            onClick={handleSubmit}
            disabled={
              isSubmitting || (!content.trim() && images.length === 0)
            }
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              !isAuthenticated && isConnected ? (
                <span className="text-xs font-bold">Sign In</span>
              ) : (
                <Send className="w-3.5 h-3.5" />
              )
            )}
            {compact ? "Reply" : (isConnected && !isAuthenticated ? "to Post" : "Comment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
