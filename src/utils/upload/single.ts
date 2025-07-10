import type { Context } from 'hono';
import fs from 'fs-extra';
import path from 'path';
import { randomUUID } from 'crypto';

interface UploadOptions {
  fieldName: string;
  directory: string;
  maxSize?: number;
  allowedMimeTypes?: string[];
}

/**
 * Uploads a single image from a multipart form request
 * @param c - Hono context
 * @param options - Upload options
 * @returns Promise with the file path if successful
 */
export async function uploadSingleImage(
  c: Context,
  options: UploadOptions
): Promise<string | null> {
  try {
    const {
      fieldName,
      directory,
      maxSize = 5 * 1024 * 1024,
      allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    // Check Content-Type header
    const contentType = c.req.header('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.log(
        `Invalid Content-Type: ${contentType}. Expected multipart/form-data`
      );
    }

    // Get form data and file
    let formData;
    let file;

    try {
      formData = await c.req.formData();
      file = formData.get(fieldName);

      if (!file || !(file instanceof File)) {
        return null;
      }
    } catch (error) {
      console.error('Error processing form data:', error);
      throw new Error(
        'Invalid form data. Make sure you are sending a proper multipart/form-data request with the correct field name.'
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds the maximum allowed size of ${maxSize / 1024 / 1024}MB`
      );
    }

    // Validate mime type
    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', directory);
    await fs.ensureDir(uploadDir);

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
  } catch (error) {
    console.error('Error uploading single image:', error);
    throw error;
  }
}
