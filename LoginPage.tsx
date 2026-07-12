import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Shield, UserCircle2, ArrowRight, Mail, Phone, Chrome } from 'lucide-react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState<'citizen' | 'mp' | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [citizenLoginMethod, setCitizenLoginMethod] = useState<'email' | 'phone'>('email');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('jan_awaaz_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'mp') navigate('/dashboard');
        else if (user.role === 'citizen' || user.role === 'anonymous') navigate('/');
      } catch (e) {
        // ignore
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (role === 'citizen' && citizenLoginMethod === 'phone' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, [role, citizenLoginMethod]);
  
  const handleMPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // MP can only login, no sign up (except auto-create for testing account)
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        if (email === 'mp@example.com' && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw signInErr;
        }
      }
      // Removed @sansad.nic.in restriction for testing purposes
      localStorage.setItem('jan_awaaz_user', JSON.stringify({ role: 'mp', email }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCitizenEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (signInErr: any) {
          if (email === 'citizen@example.com' && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
            await createUserWithEmailAndPassword(auth, email, password);
          } else {
            throw signInErr;
          }
        }
      }
      localStorage.setItem('jan_awaaz_user', JSON.stringify({ role: 'citizen', email }));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      localStorage.setItem('jan_awaaz_user', JSON.stringify({ role: 'citizen', email: auth.currentUser?.email }));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(verificationCode);
        localStorage.setItem('jan_awaaz_user', JSON.stringify({ role: 'citizen', phone: phoneNumber }));
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAnonymous = () => {
    localStorage.setItem('jan_awaaz_user', JSON.stringify({ role: 'anonymous' }));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-[#E8DCC8]">
        <div className="bg-[#1A237E] p-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Jan Awaaz</h1>
          <p className="text-[#FFD700] text-sm mt-1">{String(t("Multilingual Portal"))}</p>
        </div>
        
        <div className="p-6">
          {!role ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#3E2723] text-center mb-6">{String(t("Select Login Type"))}</h2>
              
              <button 
                onClick={() => setRole('citizen')}
                className="w-full flex items-center p-4 rounded-lg border-2 border-[#E8DCC8] hover:border-[#F4511E] transition-colors group"
              >
                <div className="bg-[#F5F2EB] p-3 rounded-full mr-4 group-hover:bg-[#F4511E] group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-[#3E2723]">{String(t("Citizen Login"))}</div>
                  <div className="text-xs text-slate-500">{String(t("Track your submissions & receive updates"))}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#F4511E]" />
              </button>

              <button 
                onClick={() => setRole('mp')}
                className="w-full flex items-center p-4 rounded-lg border-2 border-[#E8DCC8] hover:border-[#1A237E] transition-colors group"
              >
                <div className="bg-[#F5F2EB] p-3 rounded-full mr-4 group-hover:bg-[#1A237E] group-hover:text-white transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-[#3E2723]">{String(t("Member of Parliament"))}</div>
                  <div className="text-xs text-slate-500">{String(t("Access analytics and constituency dashboard"))}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#1A237E]" />
              </button>
              
              <div className="pt-4 mt-4 border-t border-[#E8DCC8]">
                <button 
                  onClick={handleAnonymous}
                  className="w-full flex items-center justify-center p-3 text-sm font-medium text-slate-600 hover:text-[#F4511E] transition-colors"
                >
                  <UserCircle2 className="w-5 h-5 mr-2" />
                  {String(t("Continue Anonymously as Citizen"))}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={() => {
                  setRole(null);
                  setError('');
                  setConfirmationResult(null);
                }}
                className="text-xs font-bold text-slate-500 mb-4 hover:text-[#3E2723]"
              >
                ← {String(t("Back to Options"))}
              </button>
              
              <h2 className="text-xl font-bold text-[#3E2723] mb-2">
                {role === 'mp' ? String(t("MP Login")) : (isSignUp ? String(t("Citizen Sign Up")) : String(t("Citizen Login")))}
              </h2>
              
              {role === 'mp' && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-md mb-6 text-xs text-blue-800 leading-relaxed">
                  <p><strong>Note:</strong> MP accounts are strictly managed. Please use your official Sansad email ID to login.</p>
                  <div className="bg-white p-2 rounded border border-blue-200 mt-2">
                    <p className="font-semibold mb-1">Testing Credentials:</p>
                    <p>Email: <code className="bg-blue-50 px-1 py-0.5 rounded">mp@example.com</code></p>
                    <p>Password: <code className="bg-blue-50 px-1 py-0.5 rounded">password123</code></p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md">
                  {error}
                </div>
              )}

              {role === 'mp' ? (
                <form onSubmit={handleMPLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{String(t("Email ID"))}</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#1A237E] focus:outline-none"
                      placeholder="mp@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{String(t("Password"))}</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#1A237E] focus:outline-none"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-sm bg-[#1A237E] hover:bg-[#121858] transition-colors mt-2"
                  >
                    {String(t("Secure Login"))}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Citizen Login Methods */}
                  <div className="flex border-b border-slate-200">
                    <button
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center ${citizenLoginMethod === 'email' ? 'border-[#F4511E] text-[#F4511E]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                      onClick={() => { setCitizenLoginMethod('email'); setError(''); }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center ${citizenLoginMethod === 'phone' ? 'border-[#F4511E] text-[#F4511E]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                      onClick={() => { setCitizenLoginMethod('phone'); setError(''); }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Phone
                    </button>
                  </div>

                  {citizenLoginMethod === 'email' && (
                    <form onSubmit={handleCitizenEmailAuth} className="space-y-4">
                      <div className="bg-orange-50 border border-orange-100 p-3 rounded-md text-xs text-orange-800 leading-relaxed">
                        <div className="bg-white p-2 rounded border border-orange-200">
                          <p className="font-semibold mb-1">Testing Credentials:</p>
                          <p>Email: <code className="bg-orange-50 px-1 py-0.5 rounded">citizen@example.com</code></p>
                          <p>Password: <code className="bg-orange-50 px-1 py-0.5 rounded">password123</code></p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{String(t("Email ID"))}</label>
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                          placeholder="citizen@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{String(t("Password"))}</label>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-sm bg-[#F4511E] hover:bg-[#D84315] transition-colors mt-2"
                      >
                        {isSignUp ? String(t("Create Account")) : String(t("Login with Email"))}
                      </button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="text-sm text-[#F4511E] font-medium hover:underline"
                        >
                          {isSignUp ? String(t("Already have an account? Login")) : String(t("Don't have an account? Sign up"))}
                        </button>
                      </div>
                    </form>
                  )}

                  {citizenLoginMethod === 'phone' && (
                    <div className="space-y-4">
                      {!confirmationResult ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{String(t("Mobile Number"))}</label>
                            <div className="flex">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                                +91
                              </span>
                              <input 
                                type="tel" 
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-slate-300 focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                                placeholder="10-digit number"
                                maxLength={10}
                                required
                              />
                            </div>
                          </div>
                          <button 
                            type="submit"
                            className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-sm bg-[#F4511E] hover:bg-[#D84315] transition-colors"
                          >
                            {String(t("Send OTP"))}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{String(t("Enter OTP"))}</label>
                            <input 
                              type="text" 
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#F4511E] focus:outline-none text-center tracking-widest text-lg"
                              placeholder="••••••"
                              maxLength={6}
                              required
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-sm bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            {String(t("Verify & Login"))}
                          </button>
                          <button 
                            type="button"
                            onClick={() => { setConfirmationResult(null); setVerificationCode(''); }}
                            className="w-full text-slate-500 font-medium py-2 hover:text-slate-700 transition-colors text-sm"
                          >
                            {String(t("Change Phone Number"))}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">Or continue with</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    <Chrome className="w-5 h-5 mr-2 text-red-500" />
                    {String(t("Google Account"))}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
