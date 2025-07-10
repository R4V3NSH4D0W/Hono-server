import { Hono } from 'hono';
import { uploadService } from '../services/upload.js';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const uploadRoutes = new Hono();

// Middleware to require authentication for all upload routes
uploadRoutes.use('*', authMiddleware);

// Upload user avatar
uploadRoutes.post('/avatar', async c => {
  try {
    // Get user ID from JWT token (set by authMiddleware)
    const user = c.get('user');

    if (!user || !user.userId) {
      console.error('No user information in request context:', user);
      return c.json(
        {
          success: false,
          error: 'User authentication information is missing or invalid',
        },
        401
      );
    }

    const userId = user.userId;
    console.log(`Attempting to upload avatar for user ID: ${userId}`);

    // Check if the user exists in the database before trying to update
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      console.error(`User with ID ${userId} not found in database`);
      return c.json(
        {
          success: false,
          error: 'User not found in database',
        },
        404
      );
    }

    const updatedUser = await uploadService.uploadAvatar(c, { userId });

    return c.json({
      success: true,
      data: updatedUser,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Error uploading avatar',
      },
      400
    );
  }
});

// Example route for uploading post images (assuming you have a Post model)
uploadRoutes.post('/post/:postId/images', async c => {
  try {
    const postId = c.req.param('postId');
    // In a real application, you would verify that the post exists and belongs to the user

    const imagePaths = await uploadService.uploadPostImages(c, {
      postId,
      maxFiles: 5, // Allow up to 5 images per post
    });

    return c.json({
      success: true,
      data: { images: imagePaths },
      message: `${imagePaths.length} images uploaded successfully`,
    });
  } catch (error) {
    console.error('Error uploading post images:', error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Error uploading images',
      },
      400
    );
  }
});

export default uploadRoutes;
