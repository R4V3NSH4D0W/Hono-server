import { Hono } from 'hono';
import { userService } from '../services/user-service.js';
import { addressService } from '../services/address-service.js';
import { authMiddleware } from '../middleware/auth.js';

const userRoutes = new Hono();

// Note: User registration and login have been moved to /api/auth routes

userRoutes.get('/profile', authMiddleware, async c => {
  try {
    const { userId } = c.get('user');
    const user = await userService.get(userId);

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'User not found',
        },
        404
      );
    }
    return c.json(
      {
        success: true,
        data: user,
      },
      200
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

userRoutes.put('/profile', authMiddleware, async c => {
  try {
    const { userId } = c.get('user');
    const body = await c.req.json();

    // Only allow updating specific fields
    const updateData: { username?: string; phone?: string } = {};
    if (body.username !== undefined) updateData.username = body.username;
    if (body.phone !== undefined) updateData.phone = body.phone;

    if (Object.keys(updateData).length === 0) {
      return c.json(
        {
          success: false,
          error: 'No valid fields provided for update',
        },
        400
      );
    }

    const user = await userService.updateProfile(userId, updateData);

    return c.json(
      {
        success: true,
        data: user,
        message: 'Profile updated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

userRoutes.get('/address', authMiddleware, async c => {
  try {
    const { userId } = c.get('user');
    const addresses = await addressService.getUserAddresses(userId);

    return c.json(
      {
        success: true,
        data: addresses,
      },
      200
    );
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch addresses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

userRoutes.post('/address', authMiddleware, async c => {
  try {
    const { userId } = c.get('user');
    const body = await c.req.json();

    // Validate required fields
    if (!body.name || !body.street || !body.city || !body.zip) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: name, street, city, zip',
        },
        400
      );
    }

    const address = await addressService.createAddress(userId, {
      name: body.name,
      street: body.street,
      city: body.city,
      zip: body.zip,
      phone: body.phone,
    });

    return c.json(
      {
        success: true,
        data: address,
        message: 'Address created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error creating address:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create address',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

userRoutes.delete('/address/:id', authMiddleware, async c => {
  try {
    const { userId } = c.get('user');
    const addressId = c.req.param('id');

    if (!addressId) {
      return c.json(
        {
          success: false,
          error: 'Address ID is required',
        },
        400
      );
    }

    const deletedAddress = await addressService.deleteAddress(
      addressId,
      userId
    );

    return c.json(
      {
        success: true,
        data: deletedAddress,
        message: 'Address deleted successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error deleting address:', error);
    const statusCode =
      error instanceof Error && error.message.includes('not found') ? 404 : 500;
    return c.json(
      {
        success: false,
        error: 'Failed to delete address',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      statusCode
    );
  }
});

userRoutes.get('/getAll', authMiddleware, async c => {
  try {
    const { role } = c.get('user');
    if (role !== 'ADMIN') {
      return c.json(
        {
          success: false,
          error: 'Unauthorized access',
        },
        403
      );
    }
    const users = await userService.getAll();
    return c.json(
      {
        success: true,
        data: users,
      },
      200
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default userRoutes;
