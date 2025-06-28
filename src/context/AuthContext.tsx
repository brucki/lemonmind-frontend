import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { 
  AuthContextType, 
  User, 
  AuthResponse,
  UserMetadata,
  UpdateUserData
} from './AuthContext.types';
import { AuthContext } from './AuthContext.context';

interface AuthProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  loginPath?: string;
  homePath?: string;
  autoRefreshSession?: boolean;
  refreshTokenThreshold?: number;
}


export function AuthProvider({ 
  children, 
  requireAuth = true, 
  loginPath = '/login',
  homePath = '/',
  autoRefreshSession = true,
  refreshTokenThreshold = 300 // 5 minutes
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define the getSession function type
  type GetSessionFunction = (forceRefresh?: boolean) => Promise<Session | null>;
  
  // Create a ref to store the getSession function
  const getSessionRef = useRef<GetSessionFunction>(() => Promise.resolve(null));
  
  // Get current session with optional force refresh
  const getSession = useCallback(async (forceRefresh = false): Promise<Session | null> => {
    try {
      let session: Session | null = null;
      
      if (forceRefresh) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        session = data.session;
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        session = data.session;
        
        // Auto-refresh session if it's about to expire
        if (session?.expires_at && 
            session.expires_at * 1000 < Date.now() + refreshTokenThreshold * 1000) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          session = refreshData.session;
        }
      }
      
      return session;
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
  }, [refreshTokenThreshold]);
  
  // Keep the ref in sync with the latest getSession function
  useEffect(() => {
    getSessionRef.current = getSession;
  }, [getSession]);

  // Check if email is confirmed (synchronous version)
  const isEmailConfirmed = useCallback((): boolean => {
    return !!user?.email_confirmed_at;
  }, [user]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    setLoading(true);
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      setUser(session?.user ?? null);
      
      // Only redirect to home if on login page and not on signup page
      if (window.location.pathname === loginPath && 
          !window.location.pathname.startsWith('/signup') &&
          !window.location.search.includes('from=signup')) {
        navigate(homePath);
      }
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
      
      // Don't redirect if we're on the signup page
      if (requireAuth && 
          window.location.pathname !== loginPath && 
          !window.location.pathname.startsWith('/signup')) {
        navigate(loginPath, { replace: true });
      }
    }
    
    setLoading(false);
  }, [homePath, loginPath, navigate, requireAuth]);

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      const session = await getSession();
      
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If no session and auth is required, redirect to login
        // Skip redirection if we're on the signup page
        if (!session && requireAuth && 
            window.location.pathname !== loginPath && 
            !window.location.pathname.startsWith('/signup')) {
          navigate(loginPath, { replace: true });
        }
      }
    };
    
    initializeAuth();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [getSession, navigate, requireAuth, loginPath, handleAuthStateChange]);

  // Sign up with email and password
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData?: UserMetadata
  ): Promise<AuthResponse<User>> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      return {
        error,
        user: data.user || null,
        session: data.session || null,
        data: data.user || undefined,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        error: error as AuthError,
        user: null,
        session: null
      };
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (
    email: string, 
    password: string
  ): Promise<AuthResponse<Session>> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return {
        error,
        user: data.user || null,
        session: data.session || null,
        data: data.session || undefined,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        error: error as AuthError,
        user: null,
        session: null
      };
    }
  }, []);

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(async (
    provider: 'google' | 'github' | 'facebook'
  ): Promise<AuthResponse<Session>> => {
    try {
      // This will trigger the OAuth flow and redirect the user
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${homePath}`,
        },
      });
      
      // This code will only run if there was an error before the redirect
      if (error) {
        return {
          error,
          user: null,
          session: null
        };
      }
      
      // The OAuth flow will redirect, so we don't need to return the session here
      return {
        error: null,
        session: null,
        user: null,
        message: 'Redirecting to provider...'
      };
    } catch (error) {
      console.error(`Sign in with ${provider} error:`, error);
      return { 
        error: error as AuthError,
        user: null,
        session: null
      };
    }
  }, [homePath]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      return { error };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: error as AuthError };
    }
  }, []);

  // Update user profile
  const updateUser = useCallback(
    async (data: UpdateUserData): Promise<AuthResponse<User>> => {
      try {
        const { data: updatedUser, error } = await supabase.auth.updateUser({
          email: data.email,
          password: data.password,
          data: data.data,
        });
        
        if (updatedUser?.user) {
          setUser(updatedUser.user);
        }
        
        return {
          error,
          user: updatedUser?.user || null,
          data: updatedUser?.user || undefined
        };
      } catch (error) {
        console.error('Update user error:', error);
        return { 
          error: error as AuthError,
          user: null
        };
      }
    },
    [setUser]
  );

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as AuthError };
    }
  }, []);
  
  // Send verification email
  const sendVerificationEmail = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });
      return { error };
    } catch (error) {
      console.error('Send verification email error:', error);
      return { error: error as AuthError };
    }
  }, []);
  
  // Verify email with token
  const verifyEmail = useCallback(async (token: string): Promise<AuthResponse<Session>> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });
      
      return {
        error,
        user: data?.user || null,
        session: data?.session || null,
        data: data?.session || undefined,
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return { 
        error: error as AuthError,
        user: null,
        session: null
      };
    }
  }, []);
  
  // Refresh session - using getSessionRef to avoid dependency on getSession
  const refreshSession = useCallback(async (): Promise<AuthResponse<Session>> => {
    try {
      if (!getSessionRef.current) {
        throw new Error('getSession is not available');
      }
      const session = await getSessionRef.current(true);
      return {
        error: null,
        user: session?.user || null,
        session: session || null,
        data: session || undefined,
      };
    } catch (error) {
      console.error('Refresh session error:', error);
      return { 
        error: error as AuthError,
        user: null,
        session: null
      };
    }
  }, []); // No dependencies needed as we're using the ref

  // Check if session email is confirmed (async version)
  const checkEmailConfirmed = useCallback(async (): Promise<boolean> => {
    if (!getSessionRef.current) return false;
    const session = await getSessionRef.current();
    return !!session?.user?.email_confirmed_at;
  }, []);

  // Check if session is valid
  const isSessionValid = useCallback(async (): Promise<boolean> => {
    if (!getSessionRef.current) return false;
    const session = await getSessionRef.current();
    return !!session?.user;
  }, []);
  
  // Use autoRefreshSession parameter for future implementation
  // Currently, it's not used but kept for future compatibility
  if (autoRefreshSession) {
    // Future implementation will go here
  }

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateUser,
    sendVerificationEmail,
    verifyEmail,
    refreshSession,
    isEmailConfirmed, // Synchronous version
    checkEmailConfirmed, // Async version
    isSessionValid,
    getSession,
  }), [
    user,
    loading,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateUser,
    sendVerificationEmail,
    verifyEmail,
    refreshSession,
    isEmailConfirmed,
    checkEmailConfirmed,
    isSessionValid,
    getSession
  ]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
