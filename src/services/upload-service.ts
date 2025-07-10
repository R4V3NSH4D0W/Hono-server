import type { Context } from 'hono';
import {
  uploadSingleImage,
  uploadMultipleImages,
} from '../utils/upload/index.js';
import { prisma } from '../lib/prisma.js';

interface AvatarUploadOptions {
  userId: string;
  fieldName?: string;
}

interface PostImagesUploadOptions {
  postId: string;
  fieldName?: string;
  maxFiles?: number;
}

export const uploadService = {
  /**
   * Upload a user avatar and update the user record
   * @param c - Hono context
   * @param options - Upload options
   * @returns Updated user with avatar URL
   */
  uploadAvatar: async (c: Context, options: AvatarUploadOptions) => {
    const { userId, fieldName = 'avatar' } = options;

    try {
      const avatarPath = await uploadSingleImage(c, {
        fieldName,
        directory: 'avatars',
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (!avatarPath) {
        throw new Error('No avatar file uploaded');
      }

      // Update user record with avatar path
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarPath },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  /**
   * Upload multiple images for a post
   * @param c - Hono context
   * @param options - Upload options
   * @returns Array of image paths
   */
  uploadPostImages: async (c: Context, options: PostImagesUploadOptions) => {
    const { postId, fieldName = 'images', maxFiles = 10 } = options;

    try {
      const imagePaths = await uploadMultipleImages(c, {
        fieldName,
        directory: `posts/${postId}`,
        maxSize: 5 * 1024 * 1024, // 5MB per file
        maxFiles,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
      });

      if (imagePaths.length === 0) {
        throw new Error('No images uploaded');
      }

      // Return the image paths (in a real application you would likely save these to a PostImage model)
      return imagePaths;
    } catch (error) {
      console.error('Error uploading post images:', error);
      throw error;
    }
  },
};
