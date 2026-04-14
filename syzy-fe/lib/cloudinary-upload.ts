/**
 * Cloudinary signed upload via backend API
 * File is sent to our backend, which uploads to Cloudinary with API secret
 */

import { apiClient } from "@/lib/kubb";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiClient.post("/api/cloudinary/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Unwrap NestJS response wrapper if present
  const data = res.data?.data ?? res.data;
  return {
    url: data.url,
    publicId: data.publicId,
  };
}
