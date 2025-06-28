import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, updateUserPassword, verifyOtp } from '../lib/supabase';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract token and type from URL
  const { token: extractedToken, type: extractedType } = useMemo(() => {
    console.log('Extracting token and type from URL...');
    const url = new URL(window.location.href);
    console.log('Full URL:', url.toString());
    
    // Try to get from hash first (newer Supabase versions)
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const hashToken = hashParams.get('access_token');
    const hashType = hashParams.get('type');
    
    console.log('Hash params:', Object.fromEntries(hashParams.entries()));
    
    // Try to get from search params (older Supabase versions)
    const searchParams = new URLSearchParams(url.search);
    const searchToken = searchParams.get('token');
    const searchType = searchParams.get('type');
    
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    
    // Try to extract token from path (some email clients might modify the URL)
    const pathParts = url.pathname.split('/');
    const pathToken = pathParts[pathParts.length - 1];
    const isPathToken = pathToken && pathToken !== 'update-password' && pathToken.length > 30; // Basic check if it looks like a token
    
    // Also try to get token from the # part if it's not in standard params
    let implicitToken = '';
    if (url.hash && url.hash.includes('#')) {
      const hashPart = url.hash.substring(1); // Remove the #
      if (!hashPart.includes('=') && !hashPart.includes('&')) {
        // If the hash looks like a token (no = or &), use it as token
        implicitToken = hashPart;
        console.log('Found implicit token in hash:', implicitToken);
      }
    }
    
    const token = hashToken || searchToken || (isPathToken ? pathToken : null) || implicitToken || '';
    const type = hashType || searchType || (token ? 'recovery' : null);
    
    console.log('Extracted token:', token ? '[token exists]' : '[no token]');
    console.log('Extracted type:', type);
    
    return { token, type };
  }, []);
  
  const tokenParam = searchParams.get('token') || searchParams.get('access_token') || extractedToken || '';
  const typeParam = searchParams.get('type') || extractedType || 'recovery';
  
  const { errorCode, errorDescription } = useMemo(() => {
    console.log('Checking for authentication errors in URL...');
    const url = new URL(window.location.href);
    
    // Check hash first (newer Supabase versions)
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const hashError = hashParams.get('error');
    const hashErrorCode = hashParams.get('error_code');
    const hashErrorDescription = hashParams.get('error_description');
    
    // Then check search params (older Supabase versions)
    const searchParams = new URLSearchParams(url.search);
    const searchError = searchParams.get('error');
    const searchErrorCode = searchParams.get('error_code');
    const searchErrorDescription = searchParams.get('error_description');
    
    // Also check if the URL contains error information in the path
    let pathError = null;
    let pathErrorCode = null;
    let pathErrorDescription = null;
    
    if (url.pathname.includes('error=')) {
      const pathParts = url.pathname.split('error=');
      const errorParts = pathParts[1].split('&');
      pathError = errorParts[0];
      
      // Try to extract error code and description
      errorParts.forEach(part => {
        if (part.startsWith('error_code=')) {
          pathErrorCode = part.replace('error_code=', '');
        } else if (part.startsWith('error_description=')) {
          pathErrorDescription = part.replace('error_description=', '').replace(/\+/g, ' ');
        }
      });
    }
    
    const result = {
      error: hashError || searchError || pathError,
      errorCode: hashErrorCode || searchErrorCode || pathErrorCode,
      errorDescription: hashErrorDescription || searchErrorDescription || pathErrorDescription
    };
    
    console.log('Authentication errors in URL:', result);
    return result;
  }, []); 
  
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for authentication errors in URL hash or params
  useEffect(() => {
    if (errorCode) {
      console.log('Authentication error detected:', { errorCode, errorDescription });
      
      let errorMessage = 'An error occurred while processing your request.';
      let showRequestNewLink = true;
      
      switch(errorCode) {
        case 'otp_expired':
          errorMessage = 'This password reset link has expired. ';
          break;
        case 'invalid_token':
          errorMessage = 'The password reset link is invalid. ';
          break;
        case 'access_denied':
          errorMessage = 'Access denied. The link may have been used already or is invalid. ';
          break;
        default:
          errorMessage = (errorDescription || errorMessage) + ' ';
          showRequestNewLink = false;
      }
      
      if (showRequestNewLink) {
        errorMessage += 'Please request a new password reset link.';
      }
      
      setAuthError(errorMessage);
      setIsLoading(false);
      return;
    }
    
    // If no error in URL, check the token
    const checkToken = async () => {
      console.log('checkToken called with type:', typeParam, 'and token:', tokenParam ? '[token exists]' : '[no token]');
      
      if (!tokenParam) {
        console.log('No token provided');
        setAuthError('No password reset token provided. Please use the link from your email.');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Attempting to verify token...');
        
        // Clean up the token - sometimes it might have URL-encoded characters
        const cleanToken = tokenParam.replace(/ /g, '+');
        
        // Try different token types
        const tokenTypes = ['recovery', 'signup', 'magiclink', 'email'] as const;
        
        for (const tokenType of tokenTypes) {
          try {
            console.log(`Trying to verify with type: ${tokenType}`);
            const { data, error } = await verifyOtp(cleanToken, tokenType);
            
            if (!error) {
              console.log(`Token verified successfully with type ${tokenType}:`, data);
              setIsTokenValid(true);
              return;
            }
            
            console.log(`Verification with type ${tokenType} failed:`, error);
          } catch (err) {
            console.error(`Error verifying with type ${tokenType}:`, err);
          }
        }
        
        // If we get here, all verification attempts failed
        throw new Error('Could not verify token with any known type');
        
      } catch (error) {
        console.error('Error in checkToken:', error);
        setAuthError('The password reset link is invalid or has expired. Please request a new one.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkToken();
  }, [errorCode, tokenParam, typeParam, errorDescription, navigate, setAuthError, setIsLoading, setIsTokenValid]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      // Update the password using our utility function
      const { error: updateError } = await updateUserPassword(password);
      
      if (updateError) throw updateError;
      
      setMessage('Password has been updated successfully. You will be redirected to login...');
      
      // Sign out the user after successful password update
      await supabase.auth.signOut();
      
      // Clear any existing tokens from URL
      window.history.replaceState({}, document.title, '/update-password');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      const error = err as Error;
      setError(`Failed to update password: ${error.message}. Please try requesting a new password reset link.`);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your password reset link...</p>
        </div>
      </div>
    );
  }

  // Show error message if there's an auth error or invalid token
  if (authError || !isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {authError?.includes('expired') ? 'Link Expired' : 'Invalid Link'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {authError || 'The password reset link is invalid or has expired.'}
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Request New Password Reset
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isTokenValid 
              ? 'Enter your new password below'
              : 'Please request a new password reset link.'
            }
          </p>
        </div>
        
        {authError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {authError}
                </p>
                <div className="mt-2">
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-red-700 hover:text-red-600 underline"
                  >
                    Request a new password reset link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{message}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
