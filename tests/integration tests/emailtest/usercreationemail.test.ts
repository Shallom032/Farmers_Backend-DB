import { authService } from '../../../src/services/authService';
import { testDb } from '../testsetup';

// Mock the email service
jest.mock('../../../src/utils/email');
const mockSendEmail = require('../../../src/utils/email').sendEmail;

describe('User Creation Email Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
  });

  describe('User Registration Email Flow', () => {
    test('should create user and send verification email', async () => {
      const userData = {
        full_name: 'John Doe',
        email: 'john.doe@test.com',
        phone: '0712345678',
        password: 'password123',
        confirmPassword: 'password123',
        location: 'Nairobi',
        role: 'farmer' as const
      };

      const result = await authService.register(userData);

      // Verify user was created
      expect(result.message).toContain('registered successfully');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.role).toBe(userData.role);

      // Verify verification URL was generated
      expect(result.verificationUrl).toBeDefined();
      expect(result.verificationUrl).toContain('token=');

      // Verify email was sent
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const emailCall = mockSendEmail.mock.calls[0];
      expect(emailCall[0]).toBe(userData.email); // recipient
      expect(emailCall[1]).toContain('Verify Your Email'); // subject
      expect(emailCall[2]).toContain(result.verificationUrl); // body contains verification URL
    });

    test('should store verification token in database', async () => {
      const userData = {
        full_name: 'Jane Smith',
        email: 'jane.smith@test.com',
        phone: '0723456789',
        password: 'password456',
        confirmPassword: 'password456',
        location: 'Kiambu',
        role: 'buyer' as const
      };

      const result = await authService.register(userData);

      // Verify token was stored in database
      const pool = await testDb.connect();
      const tokenResult = await pool.request()
        .input('email', userData.email)
        .query(`
          SELECT evt.token, u.user_id, u.email, u.role
          FROM email_verification_tokens evt
          JOIN users u ON evt.user_id = u.user_id
          WHERE u.email = @email
        `);

      expect(tokenResult.recordset.length).toBe(1);
      const tokenRecord = tokenResult.recordset[0];
      expect(tokenRecord.token).toBeDefined();
      expect(tokenRecord.email).toBe(userData.email);
      expect(tokenRecord.role).toBe(userData.role);

      // Verify the token in result matches database
      const urlToken = result.verificationUrl.split('token=')[1];
      expect(tokenRecord.token).toBe(urlToken);
    });

    test('should create farmer profile for farmer role', async () => {
      const userData = {
        full_name: 'Bob Farmer',
        email: 'bob.farmer@test.com',
        password: 'password789',
        confirmPassword: 'password789',
        location: 'Nakuru',
        role: 'farmer' as const
      };

      await authService.register(userData);

      // Verify farmer profile was created
      const pool = await testDb.connect();
      const farmerResult = await pool.request()
        .input('email', userData.email)
        .query(`
          SELECT f.* FROM farmers f
          JOIN users u ON f.user_id = u.user_id
          WHERE u.email = @email
        `);

      expect(farmerResult.recordset.length).toBe(1);
      const farmerProfile = farmerResult.recordset[0];
      expect(farmerProfile.location).toBe(userData.location);
    });

    test('should create buyer profile for buyer role', async () => {
      const userData = {
        full_name: 'Alice Buyer',
        email: 'alice.buyer@test.com',
        password: 'password101',
        confirmPassword: 'password101',
        location: 'Eldoret',
        role: 'buyer' as const
      };

      await authService.register(userData);

      // Verify buyer profile was created
      const pool = await testDb.connect();
      const buyerResult = await pool.request()
        .input('email', userData.email)
        .query(`
          SELECT b.* FROM buyers b
          JOIN users u ON b.user_id = u.user_id
          WHERE u.email = @email
        `);

      expect(buyerResult.recordset.length).toBe(1);
      const buyerProfile = buyerResult.recordset[0];
      expect(buyerProfile.location).toBe(userData.location);
    });

    test('should handle email sending failure gracefully', async () => {
      mockSendEmail.mockRejectedValue(new Error('SMTP connection failed'));

      const userData = {
        full_name: 'Failed Email User',
        email: 'failed.email@test.com',
        password: 'password999',
        confirmPassword: 'password999',
        location: 'Mombasa',
        role: 'farmer' as const
      };

      // Should not throw error even if email fails
      const result = await authService.register(userData);

      expect(result.message).toContain('registered successfully');
      expect(result.user).toBeDefined();

      // User should still be created in database
      const pool = await testDb.connect();
      const userResult = await pool.request()
        .input('email', userData.email)
        .query('SELECT * FROM users WHERE email = @email');

      expect(userResult.recordset.length).toBe(1);
    });

    test('should prevent duplicate email registration', async () => {
      const userData = {
        full_name: 'Duplicate User',
        email: 'duplicate@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        location: 'Nairobi',
        role: 'farmer' as const
      };

      // First registration should succeed
      await authService.register(userData);

      // Second registration with same email should fail
      await expect(authService.register(userData)).rejects.toThrow('Email already registered');
    });

    test('should prevent admin role registration when admin exists', async () => {
      // First create an admin
      const adminData = {
        full_name: 'Admin User',
        email: 'admin@test.com',
        password: 'adminpass',
        confirmPassword: 'adminpass',
        location: 'Nairobi',
        role: 'admin' as const
      };

      await authService.register(adminData);

      // Second admin registration should fail
      const secondAdminData = {
        full_name: 'Second Admin',
        email: 'admin2@test.com',
        password: 'adminpass2',
        confirmPassword: 'adminpass2',
        location: 'Nairobi',
        role: 'admin' as const
      };

      await expect(authService.register(secondAdminData)).rejects.toThrow('Cannot register as admin');
    });
  });
});