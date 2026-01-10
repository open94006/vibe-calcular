import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.js';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const { access_token, user } = response.data;
            login(access_token, user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || '登入失敗，請檢查帳號密碼');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        // 這裡實務上會將 credentialResponse.credential 傳給後端驗證
        console.log('Google login success:', credentialResponse);
        // 目前後端僅預留架構，故此處先打個樣
        alert('Google 登入功能後端架構已預留，待填入 Client ID 後即可啟用');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">會員登入</h2>

                {error && <div className="p-3 mb-6 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">密碼</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? '登入中...' : '登入'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 mb-4">或者使用其他方式登入</p>
                    <div className="flex justify-center">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google 登入失敗')} />
                    </div>
                </div>

                <p className="mt-8 text-sm text-center text-gray-600">
                    還沒有帳號？{' '}
                    <Link to="/register" className="font-medium text-blue-600 hover:underline">
                        立即註冊
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
