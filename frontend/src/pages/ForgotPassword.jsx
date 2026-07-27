import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ShieldAlert, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  
  // UI Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('이메일을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setSuccess(res.data.message || '비밀번호 재설정 이메일이 발송되었습니다.');
    } catch (err) {
      setError(err.response?.data?.message || '이메일 확인 중 오류가 발생했습니다. 이메일이 정확한지 확인해 주세요.');
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
        {/* Forgot Password Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl p-8 overflow-hidden transition-all duration-300">
          
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4 mr-1" />
              로그인 화면으로 돌아가기
            </Link>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">비밀번호 찾기</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            가입한 이메일을 입력하시면 비밀번호를 재설정할 수 있는 링크를 보내드립니다.
          </p>

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
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="text-lg font-bold text-white">이메일 발송 완료</h4>
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
            <form onSubmit={handleForgotPassword} className="space-y-6">
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
                    placeholder="example@seohan.com"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-150 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <>
                      재설정 이메일 전송
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
