import { Request, Response } from 'express';
import { userController } from '../../../src/controllers/userControllers';
import { userService } from '../../../src/services/userServices';
import { AuthRequest } from '../../../src/middleware/authMiddleware';

// Mock the userService
jest.mock('../../../src/services/userServices', () => ({
  userService: {
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

describe('User Controllers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { user_id: 1, full_name: 'John Doe', email: 'john@example.com', role: 'farmer' },
        { user_id: 2, full_name: 'Jane Smith', email: 'jane@example.com', role: 'buyer' },
      ];

      (userService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      await userController.getAllUsers(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle errors when getting all users', async () => {
      const mockError = new Error('Database connection failed');
      (userService.getAllUsers as jest.Mock).mockRejectedValue(mockError);

      await userController.getAllUsers(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database connection failed' });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID for admin successfully', async () => {
      const mockUser = { user_id: 1, full_name: 'John Doe', email: 'john@example.com', role: 'farmer' };
      mockRequest.params = { id: '1' };
      (mockRequest as AuthRequest).user = { user_id: 2, role: 'admin' };

      (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.getUserById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should get user by ID for own profile successfully', async () => {
      const mockUser = { user_id: 1, full_name: 'John Doe', email: 'john@example.com', role: 'farmer' };
      mockRequest.params = { id: '1' };
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.getUserById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should deny access for non-admin accessing other user profile', async () => {
      mockRequest.params = { id: '2' };
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      await userController.getUserById(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.getUserById).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('should handle user not found error', async () => {
      const mockError = new Error('User not found');
      mockRequest.params = { id: '999' };
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'admin' };

      (userService.getUserById as jest.Mock).mockRejectedValue(mockError);

      await userController.getUserById(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.getUserById).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const mockUserData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'farmer',
      };

      const mockResult = {
        message: 'User registered successfully',
        user: { user_id: 1, full_name: 'John Doe', email: 'john@example.com', role: 'farmer' },
      };

      mockRequest.body = mockUserData;
      (userService.registerUser as jest.Mock).mockResolvedValue(mockResult);

      await userController.registerUser(mockRequest as Request, mockResponse as Response);

      expect(userService.registerUser).toHaveBeenCalledWith(mockUserData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle registration errors', async () => {
      const mockUserData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'farmer',
      };

      const mockError = new Error('Email already exists');
      mockRequest.body = mockUserData;
      (userService.registerUser as jest.Mock).mockRejectedValue(mockError);

      await userController.registerUser(mockRequest as Request, mockResponse as Response);

      expect(userService.registerUser).toHaveBeenCalledWith(mockUserData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const mockLoginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockResult = {
        message: 'Login successful',
        token: 'jwt_token_here',
        user: { user_id: 1, full_name: 'John Doe', email: 'john@example.com', role: 'farmer' },
      };

      mockRequest.body = mockLoginData;
      (userService.loginUser as jest.Mock).mockResolvedValue(mockResult);

      await userController.loginUser(mockRequest as Request, mockResponse as Response);

      expect(userService.loginUser).toHaveBeenCalledWith('john@example.com', 'password123');
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle login errors', async () => {
      const mockLoginData = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const mockError = new Error('Invalid credentials');
      mockRequest.body = mockLoginData;
      (userService.loginUser as jest.Mock).mockRejectedValue(mockError);

      await userController.loginUser(mockRequest as Request, mockResponse as Response);

      expect(userService.loginUser).toHaveBeenCalledWith('john@example.com', 'wrongpassword');
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('updateUser', () => {
    it('should update user for admin successfully', async () => {
      const mockUpdateData = { full_name: 'John Smith' };
      const mockResult = { message: 'User updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;
      (mockRequest as AuthRequest).user = { user_id: 2, role: 'admin' };

      (userService.updateUser as jest.Mock).mockResolvedValue(mockResult);

      await userController.updateUser(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.updateUser).toHaveBeenCalledWith(1, mockUpdateData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should update user for own profile successfully', async () => {
      const mockUpdateData = { full_name: 'John Smith' };
      const mockResult = { message: 'User updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      (userService.updateUser as jest.Mock).mockResolvedValue(mockResult);

      await userController.updateUser(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.updateUser).toHaveBeenCalledWith(1, mockUpdateData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should deny access for non-admin updating other user', async () => {
      mockRequest.params = { id: '2' };
      mockRequest.body = { full_name: 'John Smith' };
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      await userController.updateUser(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.updateUser).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('should handle update errors', async () => {
      const mockUpdateData = { full_name: 'John Smith' };
      const mockError = new Error('Update failed');

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      (userService.updateUser as jest.Mock).mockRejectedValue(mockError);

      await userController.updateUser(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.updateUser).toHaveBeenCalledWith(1, mockUpdateData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Update failed' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockResult = { message: 'User deleted successfully' };

      mockRequest.params = { id: '1' };
      (mockRequest as AuthRequest).user = { user_id: 2, role: 'admin' };

      (userService.deleteUser as jest.Mock).mockResolvedValue(mockResult);

      await userController.deleteUser(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed');

      mockRequest.params = { id: '1' };
      (mockRequest as AuthRequest).user = { user_id: 2, role: 'admin' };

      (userService.deleteUser as jest.Mock).mockRejectedValue(mockError);

      await userController.deleteUser(mockRequest as AuthRequest, mockResponse as Response);

      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Delete failed' });
    });
  });
});