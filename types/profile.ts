export type UserRole = "admin" | "user";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  disabled_at: string | null;
  created_at: string;
  updated_at: string;
};
