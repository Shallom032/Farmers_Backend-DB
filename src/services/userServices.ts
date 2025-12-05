import { userRepository } from "../repository/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const userService = {
  getAllUsers: async () => await userRepository.getAll(),

  getUserById: async (id: number) => {
    const user = await userRepository.getById(id);
    if (!user) throw new Error("User not found");
    return user;
  },

  registerUser: async (data: any) => {
    const existing = await userRepository.getByEmail(data.email);
    if (existing) throw new Error("Email already registered");

    if (data.password !== data.confirmPassword) throw new Error("Passwords do not match");

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({ 
      ...data, 
      password_hash: hashed 
    });

    // Optionally: send welcome email
    // await sendEmail(user.email, "Welcome!", "Your account has been created and auto-verified.");

    return {
      user,
      token: jwt.sign(
        { user_id: user.user_id, role: user.role }, 
        process.env.JWT_SECRET!, 
        { expiresIn: "1h" }
      )
    };
  },

  loginUser: async (email: string, password: string) => {
    const user = await userRepository.getByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error("Invalid credentials");

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    return { token, user };
  },

  updateUser: async (id: number, data: any) => await userRepository.update(id, data),
  deleteUser: async (id: number) => await userRepository.delete(id)
};
