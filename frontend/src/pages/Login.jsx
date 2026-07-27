import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, KeyRound, Timer, ShieldAlert, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

function Login() {
  const [activeTab, setActiveTab] = useState('otp'); // 'otp' or 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // UI Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const otpInputsRef = useRef([]);
  const navigate = useNavigate();

  // Handle email validation
  const allowedDomain = '@korea.kr';
  const isEmailDomainValid = email.toLowerCase().endsWith(allowedDomain);

  // Timer Effect for OTP
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      setError('인증 번호 유효 시간이 만료되었습니다. 다시 요청해 주세요.');
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  // Format timer text (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // OTP send request
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('이메일을 입력해 주세요.');
      return;
    }
    if (!isEmailDomainValid) {
      setError(`공직자통합메일(${allowedDomain})만 사용 가능합니다.`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/api/auth/request-otp', { email });
      setOtpSent(true);
      setTimer(600); // Reset timer
      setIsTimerActive(true);
      setSuccess(res.data.message || '이메일로 인증번호가 발송되었습니다.');
      
      // Focus on first OTP input
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || '인증번호 발송에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handler
  const handleOtpChange = (element, index, value) => {
    if (isNaN(value)) return false;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Keep last char only
    setOtp(newOtp);

    // Focus next input if value is entered
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      otpInputsRef.current[index - 1].focus();
    }
  };

  // OTP Login execution
  const handleOTPLogin = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('6자리 인증번호를 모두 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/verify-otp', {
        email,
        otp: otpCode
      });

      // Save token and user info
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect to home page
      navigate('/');
      window.location.reload(); // Refresh to update App states
    } catch (err) {
      setError(err.response?.data?.message || '인증에 실패했습니다. 코드를 다시 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Password Login execution
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password
      });

      // Save token and user info
      localStorage.setItem('token', res.data.token);
      
      // Fetch user profile to get complete details
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      const profileRes = await axios.get('/api/users/profile');
      localStorage.setItem('user', JSON.stringify(profileRes.data));

      // Redirect to home page
      navigate('/');
      window.location.reload(); // Refresh to update App states
    } catch (err) {
      setError(err.response?.data?.message || '로그인 정보가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800/50 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full z-10">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 text-white shadow-xl shadow-red-500/20 mb-4 animate-pulse">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">의령소방서</h2>
          <p className="mt-2 text-sm text-slate-400">수난안전시설물 점검 관리 시스템</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl p-8 overflow-hidden transition-all duration-300">
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-900/80 rounded-2xl mb-8 border border-slate-700/30">
            <button
              onClick={() => {
                setActiveTab('otp');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'otp'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OTP 로그인
            </button>
            <button
              onClick={() => {
                setActiveTab('password');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'password'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              비밀번호 로그인
            </button>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start space-x-3 text-red-200 text-sm animate-fadeIn">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start space-x-3 text-emerald-200 text-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Forms */}
          {activeTab === 'otp' ? (
            /* OTP LOGIN FORM */
            <form onSubmit={otpSent ? handleOTPLogin : handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  회사 이메일 주소
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={otpSent}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@korea.kr"
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border ${
                      email && !isEmailDomainValid
                        ? 'border-amber-500 focus:ring-amber-500'
                        : 'border-slate-700 focus:ring-red-500'
                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 disabled:opacity-50`}
                  />
                </div>
                {email && !isEmailDomainValid && (
                  <p className="mt-2 text-xs text-amber-400 flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    공직자통합메일 주소(@korea.kr)만 등록/로그인 가능합니다.
                  </p>
                )}
              </div>

              {otpSent && (
                <div className="space-y-4 animate-slideDown">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      인증번호 입력 (6자리)
                    </label>
                    <span className={`text-xs font-bold flex items-center ${timer < 120 ? 'text-amber-400 animate-pulse' : 'text-red-400'}`}>
                      <Timer className="w-3.5 h-3.5 mr-1" />
                      {formatTime(timer)}
                    </span>
                  </div>
                  
                  {/* Character Code Inputs */}
                  <div className="flex justify-between space-x-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        required
                        value={digit}
                        ref={(el) => (otpInputsRef.current[index] = el)}
                        onChange={(e) => handleOtpChange(e.target, index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-12 h-14 text-center bg-slate-900 border border-slate-700 rounded-xl text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-150"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (email && !isEmailDomainValid)}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-500/20 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-150 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : otpSent ? (
                    <>
                      로그인 완료
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    <>
                      인증번호 요청
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>

              {otpSent && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-xs font-semibold text-slate-400 hover:text-white underline transition"
                  >
                    인증번호 재전송
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* PASSWORD LOGIN FORM */
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  이메일 주소
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@korea.kr"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    비밀번호
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                  >
                    비밀번호 재설정
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-500/20 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-150 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <>
                      로그인
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Register Footer Link */}
          <div className="mt-8 text-center border-t border-slate-700/40 pt-6">
            <p className="text-sm text-slate-400">
              계정이 없으신가요?{' '}
              <Link to="/register" className="font-semibold text-red-400 hover:text-red-300 transition">
                회원가입 하기
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
