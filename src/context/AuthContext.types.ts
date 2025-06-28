import type { 
  User as SupabaseUser, 
  AuthError, 
  Session
} from '@supabase/supabase-js';

export type User = SupabaseUser;

// Generic response type for auth operations
export interface AuthResponse<T = unknown> {
  error: AuthError | null;
  session?: Session | null;
  user?: User | null;
  data?: T;
  message?: string;
}

// Type for user metadata
export type UserMetadata = {
  [key: string]: string | number | boolean | null | undefined;
};

export interface UpdateUserData {
  email?: string;
  password?: string;
  data?: UserMetadata;
}

export interface AuthContextType {
  // State
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // Auth methods
  signUp: (email: string, password: string, userData?: UserMetadata) => Promise<AuthResponse<User>>;
  signIn: (email: string, password: string) => Promise<AuthResponse<Session>>;
  signInWithProvider: (provider: 'google' | 'github' | 'facebook') => Promise<AuthResponse<Session>>;
  signOut: () => Promise<{ error: AuthError | null }>;
  
  // Password management
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateUser: (data: UpdateUserData) => Promise<AuthResponse<User>>;
  
  // Email verification
  sendVerificationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  verifyEmail: (token: string) => Promise<AuthResponse<Session>>;
  
  // Session management
  refreshSession: () => Promise<AuthResponse<Session>>;
  getSession: (forceRefresh?: boolean) => Promise<Session | null>;
  
  // Status checks
  isEmailConfirmed: () => boolean; // Synchronous check
  checkEmailConfirmed: () => Promise<boolean>; // Async check that refreshes session
  isSessionValid: () => Promise<boolean>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
  /**
   * Whether to redirect to login when user is not authenticated
   * @default true
   */
  requireAuth?: boolean;
  /**
   * Path to redirect to when user is not authenticated
   * @default '/login'
   */
  loginPath?: string;
  /**
   * Path to redirect to after successful authentication
   * @default '/'
   */
  homePath?: string;
  /**
   * Whether to automatically refresh the session when it's about to expire
   * @default true
   */
  autoRefreshSession?: boolean;
  /**
   * Time in seconds before token expiration to trigger a refresh
   * @default 300 (5 minutes)
   */
  refreshTokenThreshold?: number;
}
