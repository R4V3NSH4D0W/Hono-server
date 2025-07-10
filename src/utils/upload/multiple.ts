import type { Context } from 'hono';
import fs from 'fs-extra';
import path from 'path';
import { randomUUID } from 'crypto';

interface UploadOptions {
  fieldName: string;
  directory: string;
  maxSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
}

/**
 * Uploads multiple images from a multipart form request
 * @param c - Hono context
 * @param options - Upload options
 * @returns Promise with an array of file paths if successful
 */
export async function uploadMultipleImages(
  c: Context,
  options: UploadOptions
): Promise<string[]> {
  try {
    const {
      fieldName,
      directory,
      maxSize = 5 * 1024 * 1024,
      maxFiles = 10,
      allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    // Check Content-Type header
    const contentType = c.req.header('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.log(
        `Invalid Content-Type: ${contentType}. Expected multipart/form-data`
      );
    }

    // Get form data
    let formData;
    const files: File[] = [];

    try {
      formData = await c.req.formData();

      // Extract all files with the specified field name
      formData.forEach((value, key) => {
        if (key === fieldName && value instanceof File) {
          files.push(value);
        }
      });
    } catch (error) {
      console.error('Error processing form data:', error);
      throw new Error(
        'Invalid form data. Make sure you are sending a proper multipart/form-data request with the correct field name.'
      );
    }

    if (files.length === 0) {
      return [];
    }

    // Validate number of files
    if (files.length > maxFiles) {
      throw new Error(
        `Too many files uploaded. Maximum allowed is ${maxFiles}`
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', directory);
    await fs.ensureDir(uploadDir);

    const uploadPromises = files.map(async file => {
      // Validate file size
      if (file.size > maxSize) {
        throw new Error(
          `File ${file.name} exceeds the maximum allowed size of ${maxSize / 1024 / 1024}MB`
        );
      }

      // Validate mime type
      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error(
          `Invalid file type for ${file.name}. Allowed types: ${allowedMimeTypes.join(', ')}`
        );
      }

      // Generate unique filename
      const fileExtension =
        path.extname(file.name) || `.${file.type.split('/')[1]}`;
      const fileName = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      // Return the relative path for storing in database
      return `/${directory}/${fileName}`;
    });

    return Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}
