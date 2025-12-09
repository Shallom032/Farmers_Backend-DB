import { Request, Response } from 'express';
import { authControllers } from '../../../src/controllers/authControllers';
import { authService } from '../../../src/services/authService';
import { AuthRequest } from '../../../src/middleware/authMiddleware';
import { userRepository } from '../../../src/repository/userRepository';

// Mock the authService
jest.mock('../../../src/services/authService', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
  },
}));

// Mock the userRepository
jest.mock('../../../src/repository/userRepository', () => ({
  userRepository: {
    getById: jest.fn(),
  },
}));

describe('Auth Controllers', () => {
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

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockUserData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        location: 'Test City',
        role: 'farmer' as const,
      };

      const mockResult = {
        message: 'User registered successfully',
        user: { user_id: 1, full_name: 'John Doe', email: 'john@example.com', role: 'farmer' },
        verificationUrl: 'http://localhost:5173/verify-email?token=abc123',
        note: 'Use the verification URL above to verify your account.',
      };

      mockRequest.body = mockUserData;
      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await authControllers.register(mockRequest as Request, mockResponse as Response);

      expect(authService.register).toHaveBeenCalledWith(mockUserData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle registration errors', async () => {
      const mockUserData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        location: 'Test City',
        role: 'farmer' as const,
      };

      const mockError = new Error('Email already registered');
      mockRequest.body = mockUserData;
      (authService.register as jest.Mock).mockRejectedValue(mockError);

      await authControllers.register(mockRequest as Request, mockResponse as Response);

      expect(authService.register).toHaveBeenCalledWith(mockUserData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email already registered' });
    });

    it('should handle missing request body', async () => {
      mockRequest.body = undefined;

      await authControllers.register(mockRequest as Request, mockResponse as Response);

      expect(authService.register).toHaveBeenCalledWith(undefined);
    });
  });

  describe('login', () => {
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
      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await authControllers.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith('john@example.com', 'password123');
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle login errors', async () => {
      const mockLoginData = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const mockError = new Error('Invalid credentials');
      mockRequest.body = mockLoginData;
      (authService.login as jest.Mock).mockRejectedValue(mockError);

      await authControllers.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith('john@example.com', 'wrongpassword');
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should handle missing email', async () => {
      const mockLoginData = {
        password: 'password123',
      };

      mockRequest.body = mockLoginData;

      await authControllers.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
    });

    it('should handle missing password', async () => {
      const mockLoginData = {
        email: 'john@example.com',
      };

      mockRequest.body = mockLoginData;

      await authControllers.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockToken = 'abc123def456';
      const mockResult = {
        message: 'Email verified successfully',
        token: 'jwt_token_here',
        user: { user_id: 1, email: 'john@example.com', role: 'farmer' },
      };

      mockRequest.query = { token: mockToken };
      (authService.verifyEmail as jest.Mock).mockResolvedValue(mockResult);

      await authControllers.verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(authService.verifyEmail).toHaveBeenCalledWith(mockToken);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle verification errors', async () => {
      const mockToken = 'invalid_token';
      const mockError = new Error('Invalid or expired token');

      mockRequest.query = { token: mockToken };
      (authService.verifyEmail as jest.Mock).mockRejectedValue(mockError);

      await authControllers.verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(authService.verifyEmail).toHaveBeenCalledWith(mockToken);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });

    it('should handle missing token', async () => {
      mockRequest.query = {};

      await authControllers.verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(authService.verifyEmail).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Verification token is required' });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        user_id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        location: 'Test City',
        role: 'farmer',
        created_at: new Date(),
      };

      const expectedProfile = {
        user_id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        location: 'Test City',
        role: 'farmer',
        created_at: mockUser.created_at,
      };

      (userRepository.getById as jest.Mock).mockResolvedValue(mockUser);
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      await authControllers.getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(userRepository.getById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedProfile);
    });

    it('should handle profile retrieval errors', async () => {
      const mockError = new Error('User not found');

      (userRepository.getById as jest.Mock).mockRejectedValue(mockError);
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      await authControllers.getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(userRepository.getById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle user not found in database', async () => {
      (userRepository.getById as jest.Mock).mockResolvedValue(null);
      (mockRequest as AuthRequest).user = { user_id: 1, role: 'farmer' };

      await authControllers.getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(userRepository.getById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle missing user in request', async () => {
      (mockRequest as AuthRequest).user = undefined;

      await authControllers.getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(userRepository.getById).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });
  });
});