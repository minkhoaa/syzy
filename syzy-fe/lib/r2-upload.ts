/**
 * R2 upload service - uploads images via oyrade-be API
 * Uses generated Kubb hooks with proper FormData handling
 */

import { useUploadControllerUploadImages } from '@/lib/api-client/hooks';
import { apiClient } from '@/lib/kubb';
import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { toast } from 'sonner';

export interface R2UploadResult {
  url: string;
  key?: string;
  size?: number;
}

export interface R2UploadResponse {
  success: boolean;
  count: number;
  urls: string[];
}

/** API may return payload directly or wrapped in { data } */
type R2UploadApiPayload = R2UploadResponse | { data: R2UploadResponse };

/**
 * Upload files to R2 via oyrade-be API
 * Maximum 5 images per request
 * 
 * @param files - Array of File or Blob objects to upload (max 5)
 * @returns Promise with array of upload results
 */
export async function uploadFilesToR2(
  files: File[] | Blob[]
): Promise<R2UploadResult[]> {
  if (!files || files.length === 0) {
    throw new Error('No files provided for upload');
  }

  if (files.length > 5) {
    throw new Error('Maximum 5 images allowed per upload');
  }

  // Create FormData
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('images', file);
  });

  try {
    const { accessToken } = useAuthStore.getState();

    if (!accessToken) {
      throw new Error('Authentication required. Please login first.');
    }

    const response = await apiClient.post<R2UploadApiPayload>('/api/r2/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const payload = response.data;
    const data: R2UploadResponse | undefined =
      payload && 'data' in payload ? payload.data : (payload as R2UploadResponse);

    if (!data?.urls || !Array.isArray(data.urls)) {
      throw new Error('Invalid upload response structure');
    }

    return data.urls.map((url: string) => ({ url }));
  } catch (error: unknown) {
    console.error('R2 upload error:', error);
    const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
    // Handle specific error messages
    if (err.response?.status === 401) {
      throw new Error('Authentication expired. Please login again.');
    }

    const message = err.response?.data?.message || err.message || 'Upload failed';
    throw new Error(message);
  }
}

/**
 * Upload a single file to R2
 * 
 * @param file - File or Blob to upload
 * @returns Promise with upload result
 */
export async function uploadFileToR2(
  file: File | Blob
): Promise<R2UploadResult> {
  const results = await uploadFilesToR2([file]);
  return results[0];
}

/**
 * React Hook for uploading files to R2
 * Uses Kubb-generated hooks with proper FormData handling
 */
export function useR2Upload() {
  const { accessToken } = useAuthStore();

  const uploadFiles = async (files: File[] | Blob[]): Promise<R2UploadResult[]> => {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    if (files.length > 5) {
      throw new Error('Maximum 5 images allowed per upload');
    }

    if (!accessToken) {
      throw new Error('Authentication required. Please login first.');
    }

    try {
      const results = await uploadFilesToR2(files);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      throw error;
    }
  };

  const uploadFile = async (file: File | Blob): Promise<R2UploadResult> => {
    const results = await uploadFiles([file]);
    return results[0];
  };

  return {
    uploadFiles,
    uploadFile,
    isAuthenticated: !!accessToken,
  };
}

/**
 * React Hook with mutation state for uploading files to R2
 * Provides loading and error states
 */
export function useR2UploadMutation() {
  const { accessToken } = useAuthStore();
  
  const uploadMutation = useUploadControllerUploadImages({
    mutation: {
      onSuccess: (data) => {
        toast.success(`${data.urls.length} image(s) uploaded successfully`);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const message = err.response?.data?.message || err.message || 'Upload failed';
        toast.error(message);
      },
    },
  });

  const uploadFiles = async (files: File[] | Blob[]): Promise<R2UploadResult[]> => {
    // Check authentication first
    if (!accessToken) {
      toast.error('Please login with your wallet first');
      throw new Error('Authentication required. Please login first.');
    }

    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    if (files.length > 5) {
      throw new Error('Maximum 5 images allowed per upload');
    }

    try {
      // Use apiClient directly for FormData upload
      const results = await uploadFilesToR2(files);
      return results;
    } catch (error) {
      throw error;
    }
  };

  const uploadFile = async (file: File | Blob): Promise<R2UploadResult> => {
    const results = await uploadFiles([file]);
    return results[0];
  };

  return {
    uploadFiles,
    uploadFile,
    isUploading: uploadMutation.isPending,
    isAuthenticated: !!accessToken,
    error: uploadMutation.error,
    reset: uploadMutation.reset,
  };
}
