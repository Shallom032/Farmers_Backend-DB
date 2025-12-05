import { Request, Response } from "express";
import { authService } from "../services/authService";
import { AuthRequest } from "../middleware/authMiddleware";
import { userRepository } from "../repository/userRepository";

export const authControllers = {
  register: async (req: Request, res: Response) => {
    try {
      console.log('Register attempt:', req.body);
      const result = await authService.register(req.body);
      console.log('Register success:', result);
      res.json(result);
    } catch (err: any) {
      console.error('Register error:', err.message);
      res.status(400).json({ message: err.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const result = await authService.login(email.trim(), password);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  // ⭐ UPDATED: Token-based email verification
  verifyEmail: async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const result = await authService.verifyEmail(token);

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  // Get current user profile
  getProfile: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Fetch complete user data from database
      const user = await userRepository.getById(req.user.user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user profile data (excluding sensitive fields like password)
      const profile = {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
        created_at: user.created_at
      };

      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};
