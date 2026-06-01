import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, OAuthProvider, updateProfile } from 'firebase/auth';
import { Mail, Lock, Eye, EyeOff, BarChart3, User } from 'lucide-react';

const LoginPage = ({ darkMode }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      }
    } catch (error) {
      console.error(`Error during ${mode}: `, error);
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already in use.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address.");
      } else {
        setError(mode === 'login' ? "Invalid email or password." : "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 overflow-hidden relative ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Background Abstract Elements */}
      <div className="absolute inset-0 z-0">
        <svg className="absolute top-1/4 left-10 w-64 h-64 opacity-20 text-blue-400" viewBox="0 0 200 200">
          <path fill="currentColor" d="M45,-78C58.3,-69.3,69.1,-56.3,77.4,-42.2C85.7,-28.1,91.5,-12.9,90.4,1.9C89.3,16.7,81.3,31.1,70.9,43.4C60.5,55.7,47.7,65.9,33.5,72.4C19.3,78.9,3.7,81.7,-11.9,79.1C-27.5,76.5,-43.1,68.5,-55.8,57.3C-68.5,46.1,-78.3,31.7,-82.9,15.8C-87.5,-0.1,-86.9,-17.5,-80.4,-32.7C-73.9,-47.9,-61.5,-60.9,-47.3,-69.2C-33.1,-77.5,-16.5,-81.1,0.4,-81.8C17.3,-82.5,31.7,-86.7,45,-78Z" transform="translate(100 100)" />
        </svg>
        <svg className="absolute bottom-1/4 right-10 w-80 h-80 opacity-20 text-purple-400" viewBox="0 0 200 200">
          <path fill="currentColor" d="M38.1,-65.4C50.2,-58.5,61.4,-49.3,69.5,-37.8C77.6,-26.3,82.5,-12.6,81.6,0.5C80.7,13.6,74,26.1,65.2,36.9C56.4,47.7,45.5,56.8,33.2,63.1C20.9,69.4,7.2,72.9,-6.2,71.2C-19.6,69.5,-32.7,62.6,-44.6,53.8C-56.5,45,-67.2,34.3,-73.1,21.3C-79,8.3,-80.1,-7,-75.7,-20.5C-71.3,-34,-61.4,-45.7,-49.8,-52.8C-38.2,-59.9,-24.9,-62.4,-11.8,-63.9C1.3,-65.4,14.4,-65.9,26.3,-65.4C38.1,-64.9,48.7,-63.4,38.1,-65.4Z" transform="translate(100 100)" />
        </svg>
        {/* Floating dots */}
        <div className="absolute top-20 right-1/4 w-3 h-3 bg-blue-400 rounded-full blur-[1px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-purple-400 rounded-full blur-[1px] opacity-40 animate-pulse delay-700"></div>
      </div>

      <div className={`relative z-10 w-full max-w-[450px] overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${
        darkMode ? 'bg-slate-800/90 border border-slate-700' : 'bg-white'
      }`}>
        <div className="p-8 pb-4">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-600 text-white'}`}>
                <BarChart3 size={24} />
              </div>
              <div className="text-left">
                <h2 className={`text-lg font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>AI Sales Forecaster</h2>
                <p className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-50'}`}>Business Insight Generator</p>
              </div>
            </div>
          </div>

          <h1 className={`text-2xl font-bold text-center mb-8 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {mode === 'login' ? 'Sign in to Your Account' : 'Create Your Account'}
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs py-2 px-4 rounded-lg text-center mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className={`text-xs font-bold uppercase tracking-tight block mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                      darkMode 
                        ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'
                    }`}
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-2">
                <label className={`text-xs font-bold uppercase tracking-tight ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Email Address</label>
                {mode === 'login' && (
                  <button type="button" className="text-xs font-semibold text-blue-500 hover:underline">Forgot Password?</button>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className={`text-xs font-bold uppercase tracking-tight ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? "Enter your password" : "Create a password"}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                mode === 'login' ? 'Log In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`px-2 font-bold ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-400'}`}>or {mode === 'login' ? 'sign in' : 'sign up'} with</span>
            </div>
          </div>

          <div className="mb-8">
            <button
              disabled={loading}
              onClick={handleGoogleSignIn}
              className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border font-black transition-all hover:shadow-lg active:scale-[0.98] ${
                darkMode ? 'bg-slate-900/50 border-slate-700 text-white hover:bg-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              } ${loading ? 'opacity-50' : ''}`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.2662 9.76452C6.19903 6.93863 8.85469 4.90909 12 4.90909C13.6909 4.90909 15.2182 5.50909 16.4182 6.49091L19.9091 3C17.7818 1.14545 15.0545 0 12 0C7.27273 0 3.19091 2.69091 1.24091 6.65455L5.2662 9.76452Z"/>
                <path fill="#4285F4" d="M23.4909 12.2727C23.4909 11.4909 23.4182 10.7091 23.2909 9.95455H12V14.4545H18.4364C18.1455 15.9273 17.3091 17.2182 16.0909 18.0364L19.9636 21.0364C22.2545 18.9091 23.4909 15.8909 23.4909 12.2727Z"/>
                <path fill="#FBBC05" d="M5.2662 14.2355L1.24091 17.3455C3.19091 21.3091 7.27273 24 12 24C15.0545 24 17.7818 23 19.9636 21.0364L16.0909 18.0364C15.0182 18.7636 13.6182 19.0909 12 19.0909C8.85469 19.0909 6.19903 17.0614 5.2662 14.2355Z"/>
                <path fill="#34A853" d="M12 19.0909C13.6182 19.0909 15.0182 18.7636 16.0909 18.0364L19.9636 21.0364C17.7818 23 15.0545 24 12 24C7.27273 24 3.19091 21.3091 1.24091 17.3455L5.2662 14.2355C5.11818 13.5273 5.04545 12.7818 5.04545 12C5.04545 11.2182 5.11818 10.4727 5.2662 9.76452L1.24091 6.65455C0.454545 8.29091 0 10.0909 0 12C0 13.9091 0.454545 15.7091 1.24091 17.3455L5.2662 14.2355Z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        <div className={`p-6 text-center border-t transition-colors ${
          darkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50 border-slate-100'
        }`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => setMode('signup')} className="text-blue-500 font-bold hover:underline">Create one</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('login')} className="text-blue-500 font-bold hover:underline">Log in</button></>
            )}
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
        <p className={`text-[10px] font-bold uppercase tracking-[3px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>AI Sales Forecaster v1.0</p>
      </div>
    </div>
  );
};

export default LoginPage;
