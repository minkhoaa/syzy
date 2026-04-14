"use client";

import { useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useR2UploadMutation } from "@/lib/r2-upload";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface R2ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSize?: number; // in MB
  className?: string;
}

/**
 * R2 Image Upload Component
 * 
 * Example usage:
 * ```tsx
 * const [imageUrl, setImageUrl] = useState("");
 * 
 * <R2ImageUpload
 *   value={imageUrl}
 *   onChange={setImageUrl}
 *   onRemove={() => setImageUrl("")}
 * />
 * ```
 */
export function R2ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  maxSize = 5, // 5MB default
  className = "",
}: R2ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, isAuthenticated } = useR2UploadMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check authentication
    if (!isAuthenticated) {
      toast.error('Please login with your wallet first');
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, GIF, etc.)");
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`Image size must be less than ${maxSize}MB`);
      return;
    }

    try {
      const result = await uploadFile(file);
      onChange?.(result.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      // Error already shown by toast in hook
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative inline-block group">
          <img
            src={value}
            alt="Uploaded"
            className="h-32 w-32 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="h-32 w-32 flex-col"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-xs">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-xs">Upload Image</span>
              <span className="text-xs text-muted-foreground mt-1">
                Max {maxSize}MB
              </span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Multiple Images Upload Component
 */
interface R2MultipleImagesUploadProps {
  values?: string[];
  onChange?: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  maxSize?: number;
  className?: string;
}

export function R2MultipleImagesUpload({
  values = [],
  onChange,
  maxImages = 5,
  disabled = false,
  maxSize = 5,
  className = "",
}: R2MultipleImagesUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading, isAuthenticated } = useR2UploadMutation();

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check authentication
    if (!isAuthenticated) {
      toast.error('Please login with your wallet first');
      return;
    }

    // Check max images limit
    if (values.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("All files must be images");
        return;
      }
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        toast.error(`Each image must be less than ${maxSize}MB`);
        return;
      }
    }

    try {
      const results = await uploadFiles(files);
      const newUrls = results.map((r) => r.url);
      onChange?.([...values, ...newUrls]);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      // Error already shown by toast in hook
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange?.(newValues);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelect}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-wrap gap-4">
        {values.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="h-24 w-24 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {values.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="h-24 w-24 flex-col"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin mb-1" />
                <span className="text-xs">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">Add Image</span>
                <span className="text-xs text-muted-foreground">
                  {values.length}/{maxImages}
                </span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
