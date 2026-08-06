import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Lock, User as UserIcon, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';

function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Preset role accounts for 1-click selection during demonstration / interview
  const presetAccounts = [
    { label: '의령 센터 사용자', id: 'user_uryeong', pass: 'pass1234', roleBadge: '센터 모바일+현황' },
    { label: '부림 센터 사용자', id: 'user_burim', pass: 'pass1234', roleBadge: '센터 모바일+현황' },
    { label: '정곡 센터 사용자', id: 'user_jeonggok', pass: 'pass1234', roleBadge: '센터 모바일+현황' },
    { label: '의령 센터 승인자', id: 'approver_uryeong', pass: 'pass1234', roleBadge: '센터장 승인+현황' },
    { label: '의령소방서 관리자', id: 'admin_station', pass: 'pass1234', roleBadge: '본서 전체 관리' },
    { label: '소방본부 관리자', id: 'admin_hq', pass: 'pass1234', roleBadge: '본부 전체 관리' }
  ];

  const handleSelectPreset = (acc) => {
    setLoginId(acc.id);
    setPassword(acc.pass);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      setError('아이디(이메일)와 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/login', {
        email: loginId,
        password
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.setItem('user', JSON.stringify({ email: loginId, role: 'center_user' }));
      }

      // Navigate to dashboard / fire water view
      navigate('/');
    } catch (err) {
      console.error('Login Failed:', err);
      setError(err.response?.data?.message || '로그인에 실패했습니다. 아이디 및 비밀번호를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg p-6 sm:p-8 space-y-6 text-left">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 text-red-700 mb-1">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">의령소방서 통합안전점검</h1>
          <p className="text-xs text-gray-500 font-medium">
            소방용수시설 및 안전시설물 통합 로그인 시스템
          </p>
        </div>

        {/* Quick Role Account Preset Selector */}
        <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-100 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-red-900">🔑 역할별 전용 계정 빠른 선택</span>
            <span className="text-[10px] text-red-600">클릭 시 자동 입력</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {presetAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPreset(acc)}
                className="text-left p-2 rounded-lg bg-white border border-red-200/80 hover:bg-red-100/50 hover:border-red-400 transition shadow-2xs group"
              >
                <div className="font-bold text-xs text-gray-800 group-hover:text-red-700">{acc.label}</div>
                <div className="text-[10px] text-gray-500 truncate">{acc.roleBadge}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              아이디 / 이메일
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="예: user_uryeong@korea.kr 또는 user_uryeong"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력 (기본: pass1234)"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>로그인 중...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> 로그인
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            의령소방서 수난안전시설물 및 소방용수 통합 현황 관리 시스템
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
