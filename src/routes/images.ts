import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { uploadSingleImage, uploadUserAvatar, uploadPostImages } from '../services/storage/image-service.js';
import { PrismaClient } from '../generated/prisma/index.js';
import { HTTPException } from 'hono/http-exception';

const images = new Hono();
const prisma = new PrismaClient();

// Middleware to extract multipart/form-data files
async function extractFiles(c: any, next: any) {
  try {
    const formData = await c.req.formData();
    const files: Record<string, { buffer: Buffer; originalFilename: string }[]> = {};
    const fields: Record<string, string> = {};
    
    // Process each form field
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        // Handle text fields
        fields[key] = value;
      } else if (value instanceof File) {
        // Handle file fields
        const buffer = Buffer.from(await value.arrayBuffer());
        const filename = value.name;
        
        if (!files[key]) {
          files[key] = [];
        }
        
        files[key].push({ buffer, originalFilename: filename });
      }
    }
    
    c.req.files = files;
    c.req.fields = fields;
    
    await next();
  } catch (error) {
    console.error('Error processing form data:', error);
    throw new HTTPException(400, { message: 'Invalid form data' });
  }
}

// Upload a single image
images.post('/upload', authMiddleware, extractFiles, async (c) => {
  try {
    const files = c.req.files;
    
    if (!files || !files.image || files.image.length === 0) {
      return c.json({ success: false, error: 'No image file provided' }, 400);
    }
    
    const file = files.image[0];
    const uploadedImage = await uploadSingleImage(file.buffer, file.originalFilename);
    
    return c.json({
      success: true,
      image: uploadedImage
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ success: false, error: 'Failed to upload image' }, 500);
  }
});

// Upload user avatar
images.post('/avatar', authMiddleware, extractFiles, async (c) => {
  try {
    const files = c.req.files;
    const userId = c.req.user.id;
    
    if (!files || !files.avatar || files.avatar.length === 0) {
      return c.json({ success: false, error: 'No avatar file provided' }, 400);
    }
    
    const file = files.avatar[0];
    const uploadedImage = await uploadUserAvatar(file.buffer, file.originalFilename, userId);
    
    return c.json({
      success: true,
      avatar: uploadedImage.url
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return c.json({ success: false, error: 'Failed to upload avatar' }, 500);
  }
});

// Upload multiple images for a post
images.post('/post/:postId?', authMiddleware, extractFiles, async (c) => {
  try {
    const files = c.req.files;
    const userId = c.req.user.id;
    const postId = c.req.param('postId');
    
    if (!files || !files.images || files.images.length === 0) {
      return c.json({ success: false, error: 'No image files provided' }, 400);
    }
    
    // Create post first if postId is not provided
    let finalPostId = postId;
    if (!postId) {
      const content = c.req.fields?.content || '';
      const post = await prisma.post.create({
        data: {
          content,
          userId
        }
      });
      finalPostId = post.id;
    } else {
      // Verify post exists and belongs to user
      const post = await prisma.post.findUnique({
        where: { id: postId }
      });
      
      if (!post) {
        return c.json({ success: false, error: 'Post not found' }, 404);
      }
      
      if (post.userId !== userId) {
        return c.json({ success: false, error: 'Unauthorized' }, 403);
      }
    }
    
    const uploadedImages = await uploadPostImages(files.images, finalPostId);
    
    return c.json({
      success: true,
      postId: finalPostId,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Error uploading post images:', error);
    return c.json({ success: false, error: 'Failed to upload images' }, 500);
  }
});

export default images;
