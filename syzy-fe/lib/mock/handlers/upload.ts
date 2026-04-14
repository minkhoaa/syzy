/**
 * Mock handlers for upload endpoints
 *
 * POST /api/r2/upload
 * POST /api/cloudinary/upload
 */

import { success } from '../utils';

export function handleR2Upload() {
  return success({
    url: `https://picsum.photos/seed/${Date.now()}/400/400`,
    key: `uploads/mock-${Date.now()}.jpg`,
  });
}

export function handleCloudinaryUpload() {
  return success({
    url: `https://picsum.photos/seed/${Date.now()}/400/400`,
    publicId: `mock-${Date.now()}`,
    format: 'jpg',
    width: 400,
    height: 400,
  });
}
