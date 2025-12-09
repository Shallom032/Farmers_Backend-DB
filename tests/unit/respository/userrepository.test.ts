import { userRepository } from '../../../src/repository/userRepository';
import { getPool } from '../../../src/db/config';

// Mock dependencies
jest.mock('../../../src/db/config');

const mockGetPool = getPool as jest.MockedFunction<typeof getPool>;
const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn()
};
mockGetPool.mockResolvedValue(mockPool as any);

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      const mockUsers = [{ user_id: 1 }, { user_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockUsers });

      const result = await userRepository.getAll();

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = { user_id: 1, full_name: 'John Doe' };
      mockPool.query.mockResolvedValue({ recordset: [mockUser] });

      const result = await userRepository.getById(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = { user_id: 1, email: 'john@example.com' };
      mockPool.query.mockResolvedValue({ recordset: [mockUser] });

      const result = await userRepository.getByEmail('john@example.com');

      expect(mockPool.input).toHaveBeenCalledWith('email', 'john@example.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const userData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'hashedpass',
        phone: '1234567890',
        role: 'buyer'
      };
      const mockCreatedUser = { user_id: 1, ...userData };
      mockPool.query.mockResolvedValue({ recordset: [mockCreatedUser] });

      const result = await userRepository.create(userData);

      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateData = { full_name: 'Jane Doe', phone: '0987654321', role: 'farmer' };

      const result = await userRepository.update(1, updateData);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('full_name', 'Jane Doe');
      expect(mockPool.input).toHaveBeenCalledWith('phone', '0987654321');
      expect(mockPool.input).toHaveBeenCalledWith('role', 'farmer');
      expect(result).toEqual({ message: 'User updated' });
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const result = await userRepository.delete(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual({ message: 'User deleted' });
    });
  });
});