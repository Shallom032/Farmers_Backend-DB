import { authRepository } from '../../../src/repository/authRepository';
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

describe('AuthRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = { user_id: 1, email: 'test@example.com' };
      mockPool.query.mockResolvedValue({ recordset: [mockUser] });

      const result = await authRepository.getByEmail('test@example.com');

      expect(mockPool.input).toHaveBeenCalledWith('email', 'test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user not found', async () => {
      mockPool.query.mockResolvedValue({ recordset: [] });

      const result = await authRepository.getByEmail('notfound@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = { user_id: 1, full_name: 'John Doe' };
      mockPool.query.mockResolvedValue({ recordset: [mockUser] });

      const result = await authRepository.getById(1);

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserByRole', () => {
    it('should return user by role', async () => {
      const mockUser = { user_id: 1, role: 'admin' };
      mockPool.query.mockResolvedValue({ recordset: [mockUser] });

      const result = await authRepository.getUserByRole('admin');

      expect(mockPool.input).toHaveBeenCalledWith('role', 'admin');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        location: 'Nairobi',
        role: 'farmer' as const,
        password_hash: 'hashedpass'
      };
      const mockCreatedUser = { user_id: 1, ...userData };
      mockPool.query.mockResolvedValue({ recordset: [mockCreatedUser] });

      const result = await authRepository.createUser(userData);

      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateData = { full_name: 'Jane Doe', is_verified: 1 };

      await authRepository.updateUser(1, updateData);

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('full_name', 'Jane Doe');
      expect(mockPool.input).toHaveBeenCalledWith('is_verified', 1);
    });
  });

  describe('createFarmerProfile', () => {
    it('should create farmer profile', async () => {
      await authRepository.createFarmerProfile(1);

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 1);
      expect(mockPool.query).toHaveBeenCalledWith('INSERT INTO farmers (user_id) VALUES (@user_id)');
    });
  });

  describe('createBuyerProfile', () => {
    it('should create buyer profile', async () => {
      await authRepository.createBuyerProfile(1);

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 1);
      expect(mockPool.query).toHaveBeenCalledWith('INSERT INTO buyers (user_id) VALUES (@user_id)');
    });
  });

  describe('createLogisticsProfile', () => {
    it('should create logistics profile', async () => {
      await authRepository.createLogisticsProfile(1);

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 1);
      expect(mockPool.query).toHaveBeenCalledWith('INSERT INTO logistics (delivery_agent_id) VALUES (@user_id)');
    });
  });

  describe('saveVerificationToken', () => {
    it('should save verification token', async () => {
      await authRepository.saveVerificationToken(1, 'token123');

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('token', 'token123');
      expect(mockPool.query).toHaveBeenCalledWith(`
        INSERT INTO email_verification_tokens (user_id, token)
        VALUES (@user_id, @token)
      `);
    });
  });

  describe('getTokenRecord', () => {
    it('should return token record with user info', async () => {
      const mockRecord = { user_id: 1, token: 'token123', email: 'test@example.com', role: 'farmer' };
      mockPool.query.mockResolvedValue({ recordset: [mockRecord] });

      const result = await authRepository.getTokenRecord('token123');

      expect(mockPool.input).toHaveBeenCalledWith('token', 'token123');
      expect(result).toEqual(mockRecord);
    });
  });

  describe('deleteToken', () => {
    it('should delete verification token', async () => {
      await authRepository.deleteToken('token123');

      expect(mockPool.input).toHaveBeenCalledWith('token', 'token123');
      expect(mockPool.query).toHaveBeenCalledWith(`
        DELETE FROM email_verification_tokens WHERE token = @token
      `);
    });
  });
});