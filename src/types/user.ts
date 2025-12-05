export interface User {
  user_id?: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string;
  role: "farmer" | "buyer" | "logistics";
}
