import { authService } from '../../../src/services/authService';
import { authRepository } from '../../../src/repository/authRepository';
import { sendEmail } from '../../../src/utils/email';

// Mock dependencies
jest.mock('../../../src/repository/authRepository');
jest.mock('../../../src/utils/email');
jest.mock('../../../src/db/config', () => ({
  config: { jwtSecret: 'test-secret' }
}));

const mockAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validData = {
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'password123',
      confirmPassword: 'password123',
      location: 'Nairobi',
      role: 'farmer' as const
    };

    it('should register new user successfully', async () => {
      const mockUser = { user_id: 1, ...validData, password_hash: 'hashed', is_verified: 0 };
      mockAuthRepository.getByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockUser);
      mockAuthRepository.createFarmerProfile.mockResolvedValue(undefined);
      mockAuthRepository.saveVerificationToken.mockResolvedValue(undefined);
      mockSendEmail.mockResolvedValue(undefined);

      const result = await authService.register(validData);

      expect(mockAuthRepository.createUser).toHaveBeenCalled();
      expect(mockAuthRepository.createFarmerProfile).toHaveBeenCalledWith(1);
      expect(mockSendEmail).toHaveBeenCalled();
      expect(result.message).toContain('registered successfully');
    });

    it('should throw error for missing full name', async () => {
      const invalidData = { ...validData, full_name: '' };
      await expect(authService.register(invalidData)).rejects.toThrow('Full name is required');
    });

    it('should throw error for existing verified email', async () => {
      const existingUser = { user_id: 1, email: 'john@example.com', is_verified: 1 };
      mockAuthRepository.getByEmail.mockResolvedValue(existingUser);

      await expect(authService.register(validData)).rejects.toThrow('Email already registered');
    });

    it('should prevent admin registration if admin exists', async () => {
      const adminData = { ...validData, role: 'admin' as const };
      mockAuthRepository.getUserByRole.mockResolvedValue({ user_id: 1 });

      await expect(authService.register(adminData)).rejects.toThrow('Cannot register as admin');
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        user_id: 1,
        email: 'john@example.com',
        password_hash: 'hashed',
        full_name: 'John Doe',
        role: 'farmer'
      };
      mockAuthRepository.getByEmail.mockResolvedValue(mockUser);
      (require('bcrypt').compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('john@example.com', 'password123');

      expect(result.message).toBe('Login successful');
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
    });

    it('should throw error for invalid email', async () => {
      mockAuthRepository.getByEmail.mockResolvedValue(null);

      await expect(authService.login('invalid@example.com', 'password')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = { user_id: 1, password_hash: 'hashed' };
      mockAuthRepository.getByEmail.mockResolvedValue(mockUser);
      (require('bcrypt').compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('john@example.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockRecord = { user_id: 1, email: 'john@example.com', role: 'farmer' };
      mockAuthRepository.getTokenRecord.mockResolvedValue(mockRecord);
      mockAuthRepository.updateUser.mockResolvedValue(undefined);
      mockAuthRepository.deleteToken.mockResolvedValue(undefined);

      const result = await authService.verifyEmail('valid-token');

      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(1, { is_verified: 1 });
      expect(mockAuthRepository.deleteToken).toHaveBeenCalledWith('valid-token');
      expect(result.message).toBe('Email verified successfully');
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid token', async () => {
      mockAuthRepository.getTokenRecord.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired token');
    });
  });
});