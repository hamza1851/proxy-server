import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserModel } from '../db/models/User.js';
import { isDbConnected } from '../db/connection.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'Username/ID and password are required' });
        return;
      }

      let authenticated = false;
      let userRole = 'operator';

      if (isDbConnected()) {
        const user = await UserModel.findOne({ username });
        if (user) {
          const match = await bcrypt.compare(password, user.passwordHash);
          if (match) {
            authenticated = true;
            userRole = user.role;
          }
        }
      }

      // Check against configured environment fallback credentials
      if (!authenticated) {
        if (username === config.adminUser && password === config.adminPassword) {
          authenticated = true;
          userRole = 'operator';
        }
      }

      if (!authenticated) {
        res.status(401).json({ error: 'Invalid Operator ID or Access Key' });
        return;
      }

      const token = jwt.sign(
        { username, role: userRole },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          username,
          role: userRole
        },
        message: 'OPERATOR CREDENTIALS VERIFIED // ACCESS GRANTED'
      });
    } catch (err) {
      console.error('[AuthController] Login error:', err);
      res.status(500).json({ error: 'Authentication internal error' });
    }
  }

  public static getMe(req: AuthRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json({
      success: true,
      user: req.user
    });
  }
}
