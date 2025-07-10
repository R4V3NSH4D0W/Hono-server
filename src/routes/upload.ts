import { Hono } from 'hono';
import { uploadService } from '../services/upload.js';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const uploadRoutes = new Hono();

uploadRoutes.use('*', authMiddleware);

uploadRoutes.post('/avatar', async c => {
  try {
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

uploadRoutes.post('/post/:postId/images', async c => {
  try {
    const postId = c.req.param('postId');

    const imagePaths = await uploadService.uploadPostImages(c, {
      postId,
      maxFiles: 5,
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
