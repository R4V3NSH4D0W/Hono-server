import { Hono } from 'hono';
import { userService } from '../services/user.js';
import { authMiddleware, invalidateToken } from '../middleware/auth.js';

const userRoutes = new Hono();

userRoutes.post('/', async c => {
  try {
    const body = await c.req.json();
    if (!body.email || !body.username || !body.password)
      return c.json(
        {
          success: false,
          error: 'Missing required fields: email, username, password',
        },
        400
      );
    const existingUser = await userService.findByEmail(body.email);
    if (existingUser) {
      return c.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        409
      );
    }
    const user = await userService.create(body);
    return c.json(
      {
        success: true,
        data: user,
        message: 'User created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

userRoutes.post('/login', async c => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        400
      );
    }

    const result = await userService.login(email, password);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error || 'Invalid credentials',
        },
        401
      );
    }

    return c.json(
      {
        success: true,
        data: result.data,
        message: 'Login successful',
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to login',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

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

userRoutes.post('/logout', authMiddleware, async c => {
  try {
    const token = c.get('token');

    invalidateToken(token);

    return c.json(
      {
        success: true,
        message: 'Logout successful',
      },
      200
    );
  } catch (error) {
    console.error('Error during logout:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to logout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default userRoutes;
