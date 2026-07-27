import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, UserPlus, ShieldAlert, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  // Handle email validation
  const allowedDomain = '@korea.kr';
  const isEmailDomainValid = email.toLowerCase().endsWith(allowedDomain);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('모든 필드를 입력해 주세요.');
      return;
    }

    if (!isEmailDomainValid) {
      setError(`공직자통합메일(${allowedDomain})만 사용 가능합니다.`);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/api/auth/register', {
        email,
        password
      });

      setSuccess(res.data.message || '회원가입이 완료되었습니다. 이메일을 확인하여 인증해 주세요.');
      
      // Clear inputs
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
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
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">의령소방서</h2>
          <p className="mt-2 text-sm text-slate-400">수난안전시설물 점검 관리 시스템</p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl p-8 overflow-hidden transition-all duration-300">
          
          <h3 className="text-xl font-bold text-white mb-6">사용자 계정 등록</h3>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start space-x-3 text-red-200 text-sm animate-fadeIn">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full mb-2">
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-white">가입 완료 및 이메일 전송</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {success}
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  로그인 화면으로 이동
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@korea.kr"
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border ${
                      email && !isEmailDomainValid
                        ? 'border-amber-500 focus:ring-amber-500'
                        : 'border-slate-700 focus:ring-red-500'
                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                  />
                </div>
                {email && !isEmailDomainValid && (
                  <p className="mt-2 text-xs text-amber-400 flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    공직자통합메일 주소(@korea.kr)만 회원가입이 가능합니다.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="최소 6자리 입력"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-700 focus:ring-red-500'
                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-xs text-red-400">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (email && !isEmailDomainValid) || (confirmPassword && password !== confirmPassword)}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-150 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <>
                      가입 신청하기
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login Footer Link */}
          {!success && (
            <div className="mt-8 text-center border-t border-slate-700/40 pt-6">
              <p className="text-sm text-slate-400">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-semibold text-red-400 hover:text-red-300 transition">
                  로그인 하러가기
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Register;
