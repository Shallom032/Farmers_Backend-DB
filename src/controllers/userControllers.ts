import { Request, Response } from "express";
import { userService } from "../services/userServices";
import { AuthRequest } from "../middleware/authMiddleware";

export const userController = {
  getAllUsers: async (_req: AuthRequest, res: Response) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  getUserById: async (req: AuthRequest, res: Response) => {
    try {
      // Allow access if admin or requesting own profile
      if (req.user!.role !== 'admin' && req.user!.user_id !== +req.params.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await userService.getUserById(+req.params.id);
      res.json(user);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  registerUser: async (req: Request, res: Response) => {
    try {
      const result = await userService.registerUser(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  loginUser: async (req: Request, res: Response) => {
    try {
      const result = await userService.loginUser(req.body.email, req.body.password);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  updateUser: async (req: AuthRequest, res: Response) => {
    try {
      // Allow update if admin or updating own profile
      if (req.user!.role !== 'admin' && req.user!.user_id !== +req.params.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await userService.updateUser(+req.params.id, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  deleteUser: async (req: AuthRequest, res: Response) => {
    try {
      const result = await userService.deleteUser(+req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
};
