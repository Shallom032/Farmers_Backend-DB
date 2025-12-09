import { userService } from '../../../src/services/userServices';
import { userRepository } from '../../../src/repository/userRepository';

// Mock dependencies
jest.mock('../../../src/repository/userRepository');

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      mockUserRepository.getAll.mockResolvedValue(mockUsers as any);

      const result = await userService.getAllUsers();

      expect(mockUserRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, name: 'User 1' };
      mockUserRepository.getById.mockResolvedValue(mockUser as any);

      const result = await userService.getUserById(1);

      expect(mockUserRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.getById.mockResolvedValue(null as any);

      await expect(userService.getUserById(999)).rejects.toThrow('User not found');
    });
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const userData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'buyer'
      };
      const mockUser = { user_id: 1, ...userData };
      mockUserRepository.getByEmail.mockResolvedValue(null as any);
      mockUserRepository.create.mockResolvedValue(mockUser as any);

      const result = await userService.registerUser(userData);

      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
    });

    it('should throw error for existing email', async () => {
      const userData = { email: 'john@example.com', password: 'pass', confirmPassword: 'pass' };
      const existingUser = { id: 1 };
      mockUserRepository.getByEmail.mockResolvedValue(existingUser as any);

      await expect(userService.registerUser(userData)).rejects.toThrow('Email already registered');
    });

    it('should throw error for password mismatch', async () => {
      const userData = { email: 'john@example.com', password: 'pass1', confirmPassword: 'pass2' };

      await expect(userService.registerUser(userData)).rejects.toThrow('Passwords do not match');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const email = 'john@example.com';
      const password = 'password123';
      const mockUser = {
        user_id: 1,
        email,
        password_hash: 'hashed',
        full_name: 'John Doe',
        role: 'buyer'
      };
      mockUserRepository.getByEmail.mockResolvedValue(mockUser as any);
      (require('bcrypt').compare as jest.Mock).mockResolvedValue(true);

      const result = await userService.loginUser(email, password);

      expect(result.token).toBeDefined();
      expect(result.user).toEqual(mockUser);
    });

    it('should throw error for invalid email', async () => {
      mockUserRepository.getByEmail.mockResolvedValue(null as any);

      await expect(userService.loginUser('invalid@example.com', 'pass')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = { user_id: 1, password_hash: 'hashed' };
      mockUserRepository.getByEmail.mockResolvedValue(mockUser as any);
      (require('bcrypt').compare as jest.Mock).mockResolvedValue(false);

      await expect(userService.loginUser('john@example.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateData = { full_name: 'New Name' };
      mockUserRepository.update.mockResolvedValue(undefined as any);

      const result = await userService.updateUser(1, updateData);

      expect(mockUserRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockUserRepository.delete.mockResolvedValue(undefined as any);

      const result = await userService.deleteUser(1);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });
});