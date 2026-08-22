import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { supabaseAuth } from "../lib/supabaseAuth";
import { AuthCredentials, RegisterInput, UserProfile, UserRole } from "../types/auth";
import { HttpError } from "../utils/httpError";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

const sanitizeRole = (role: string): UserRole => {
  if (role === "admin" || role === "club_staff" || role === "player" || role === "public") {
    return role;
  }
  return "public";
};

const mapProfile = (row: UserProfile): UserProfile => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  role: sanitizeRole(row.role),
  club_id: row.club_id,
  player_id: row.player_id
});

export const registerUser = async (input: RegisterInput): Promise<{ user: User; profile: UserProfile }> => {
  const { data, error } = await supabaseAuth.auth.signUp({
    email: input.email,
    password: input.password
  });

  if (error || !data.user) {
    throw new HttpError(400, error?.message ?? "Failed to create account");
  }

  const profilePayload = {
    id: data.user.id,
    email: input.email,
    full_name: input.fullName,
    role: "public"
  };

  const { data: profileRow, error: profileError } = await supabase
    .from("users")
    .insert(profilePayload)
    .select("id, email, full_name, role, club_id, player_id")
    .single();

  if (profileError || !profileRow) {
    throw new HttpError(500, profileError?.message ?? "Failed to create user profile");
  }

  return {
    user: data.user,
    profile: mapProfile(profileRow as UserProfile)
  };
};

export const loginUser = async (input: AuthCredentials): Promise<LoginResult> => {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });

  if (error || !data.session) {
    throw new HttpError(401, error?.message ?? "Invalid email or password");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
    tokenType: data.session.token_type
  };
};

export const getAuthUser = async (accessToken: string): Promise<User> => {
  const { data, error } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(401, error?.message ?? "Invalid or expired token");
  }

  return data.user;
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, club_id, player_id")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, error?.message ?? "User profile not found");
  }

  return mapProfile(data as UserProfile);
};
