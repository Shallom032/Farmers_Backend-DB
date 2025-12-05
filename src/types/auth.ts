// User roles
export type UserRole = "farmer" | "buyer" | "logistics";

// User table
export interface User {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string;
  role: UserRole;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Input data for creating a new user
export interface CreateUserDTO {
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password_hash: string;
}

// Input data for updating a user
export type UpdateUserDTO = Partial<Pick<User, "full_name" | "email" | "phone" | "role" | "password_hash" | "is_verified">>;

// Minimal user profile creation (farmer/buyer/logistics)
export interface UserProfileCreation {
  user_id: number;
}
