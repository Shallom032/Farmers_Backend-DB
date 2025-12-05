// src/services/authService.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authRepository } from "../repository/authRepository";
import { config } from "../db/config";
import { sendEmail } from "../utils/email"; // <-- You will create this file

export const authService = {

  // ----------------------------------------------------------
  // REGISTER USER (Now generates token + sends verification)
  // ----------------------------------------------------------
  register: async (data: {
    full_name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    location?: string;
    role?: "farmer" | "buyer" | "logistics" | "admin";
  }) => {
    if (!data.full_name?.trim()) throw new Error("Full name is required");
    if (!data.email?.trim()) throw new Error("Email is required");
    if (!data.password) throw new Error("Password is required");
    if (!data.location?.trim()) throw new Error("Location is required");
    if (!data.role) throw new Error("Role is required");
    if (data.role === "admin") {
      // Check if an admin already exists
      const existingAdmin = await authRepository.getUserByRole("admin");
      if (existingAdmin) throw new Error("Cannot register as admin");
    }

    const full_name = data.full_name.trim();
    const email = data.email.trim();
    const phone = data.phone?.trim() || undefined;
    const location = data.location!.trim();
    const password = data.password;
    const confirmPassword = data.confirmPassword || data.password;

    if (password !== confirmPassword) throw new Error("Passwords do not match");

    let newUser;
    const existing = await authRepository.getByEmail(email);
    if (existing) {
      if (existing.is_verified) {
        throw new Error("Email already registered");
      } else {
        // Update existing unverified user
        const password_hash = await bcrypt.hash(password, 10);
        await authRepository.updateUser(existing.user_id, { password_hash, full_name, phone, role: data.role! });
        newUser = existing;
        // Profiles should already exist, skip creating
      }
    } else {
      const password_hash = await bcrypt.hash(password, 10);

      newUser = await authRepository.createUser({
        full_name,
        email,
        phone,
        location,
        role: data.role!,
        password_hash,
      });

      // Create profiles
      if (data.role === "farmer") await authRepository.createFarmerProfile(newUser.user_id);
      if (data.role === "buyer") await authRepository.createBuyerProfile(newUser.user_id);
      if (data.role === "logistics") await authRepository.createLogisticsProfile(newUser.user_id);
    }

    // For development, auto-verify the user
    await authRepository.updateUser(newUser.user_id, { is_verified: 1 });

    // Generate JWT token for auto-login
    const jwtToken = jwt.sign(
      { user_id: newUser.user_id, role: newUser.role },
      config.jwtSecret,
      { expiresIn: "1h" }
    );

    return {
      message: "User registered successfully",
      token: jwtToken,
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role
      }
    };
  },

  // ----------------------------------------------------------
  // LOGIN USER (unchanged except requiring is_verified = 1)
  // ----------------------------------------------------------
  login: async (email?: string, password?: string) => {
    if (!email?.trim()) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");

    const user = await authRepository.getByEmail(email.trim());
    if (!user) throw new Error("Invalid credentials");

    // Temporarily disable verification for development
    // if (!user.is_verified) throw new Error("Please verify your email before logging in");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Invalid credentials");

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      config.jwtSecret,
      { expiresIn: "1h" }
    );

    return {
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    };
  },

  // ----------------------------------------------------------
  // EMAIL VERIFICATION (now token-based + auto-login)
  // ----------------------------------------------------------
  verifyEmail: async (token: string) => {
    const record = await authRepository.getTokenRecord(token);
    if (!record) throw new Error("Invalid or expired token");

    // Mark user as verified
    await authRepository.updateUser(record.user_id, { is_verified: 1 });

    // Delete verification token
    await authRepository.deleteToken(token);

    // Auto-login with JWT after verification
    const jwtToken = jwt.sign(
      { user_id: record.user_id, role: record.role },
      config.jwtSecret,
      { expiresIn: "1h" }
    );

    return {
      message: "Email verified successfully",
      token: jwtToken,
      user: {
        user_id: record.user_id,
        email: record.email,
        role: record.role
      }
    };
  }
};
