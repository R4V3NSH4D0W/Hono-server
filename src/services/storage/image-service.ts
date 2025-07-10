import {
  minioClient,
  defaultBucket,
  publicBaseUrl,
  initializeBucket,
} from './minio-config.js';
import { PrismaClient } from '../../generated/prisma/index.js';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const prisma = new PrismaClient();

// Supported image formats
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// Types for image uploads
export interface UploadedImage {
  id: string;
  filename: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  bucket: string;
}

/**
 * Initializes the storage service
 */
export const initializeStorage = async () => {
  await initializeBucket();
  console.log('Storage service initialized');
};

/**
 * Helper to get file extension from mime type
 */
const getExtensionFromMimeType = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  return extensions[mimeType] || '';
};

/**
 * Save buffer to temporary file
 */
const saveTempFile = async (buffer: Buffer): Promise<string> => {
  const tempPath = path.join(os.tmpdir(), `${uuidv4()}`);
  await fs.writeFile(tempPath, buffer);
  return tempPath;
};

/**
 * Validate image buffer
 */
const validateImage = async (
  buffer: Buffer
): Promise<{ valid: boolean; mimeType?: string }> => {
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType || !SUPPORTED_MIME_TYPES.includes(fileType.mime)) {
    return { valid: false };
  }

  return { valid: true, mimeType: fileType.mime };
};

/**
 * Upload a single image to MinIO from a buffer
 */
export const uploadSingleImage = async (
  buffer: Buffer,
  originalFilename: string,
  folder = 'general'
): Promise<UploadedImage> => {
  try {
    // Validate the image
    const validation = await validateImage(buffer);
    if (!validation.valid || !validation.mimeType) {
      throw new Error('Invalid image format');
    }

    // Create unique filename
    const extension = getExtensionFromMimeType(validation.mimeType);
    const filename = `${uuidv4()}${extension}`;
    const objectPath = `${folder}/${filename}`;

    // Save to temp file for streaming to MinIO
    const tempPath = await saveTempFile(buffer);

    // Upload to MinIO
    await minioClient.fPutObject(defaultBucket, objectPath, tempPath, {
      'Content-Type': validation.mimeType,
    });

    // Remove temp file
    await fs
      .unlink(tempPath)
      .catch(err => console.error('Error removing temp file:', err));

    // Create database record
    const image = await prisma.image.create({
      data: {
        filename: originalFilename,
        path: objectPath,
        url: `${publicBaseUrl}/${objectPath}`,
        mimeType: validation.mimeType,
        size: buffer.length,
        bucket: defaultBucket,
      },
    });

    return image;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload a user avatar image
 */
export const uploadUserAvatar = async (
  buffer: Buffer,
  originalFilename: string,
  userId: string
): Promise<UploadedImage> => {
  // Upload avatar to avatars folder
  const image = await uploadSingleImage(buffer, originalFilename, 'avatars');

  // Update user record with avatar URL
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: image.url },
  });

  return image;
};

/**
 * Upload multiple images for a post
 */
export const uploadPostImages = async (
  files: { buffer: Buffer; originalFilename: string }[],
  postId?: string
): Promise<UploadedImage[]> => {
  try {
    const uploadedImages: UploadedImage[] = [];

    for (const file of files) {
      const image = await uploadSingleImage(
        file.buffer,
        file.originalFilename,
        'posts'
      );

      // Associate with post if postId provided
      if (postId) {
        await prisma.image.update({
          where: { id: image.id },
          data: { postId },
        });
      }

      uploadedImages.push(image);
    }

    return uploadedImages;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};
