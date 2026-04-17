import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { findUser } from '../storage';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import { LogIn, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { setUser } = useStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = findUser(email, password);
            setUser(user);
            toast.success('Welcome back!');
            navigate(user.role === 'Admin' ? '/admin/dashboard' : '/dashboard');
        } catch (error) {
            toast.error(error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full glass-card p-8 shadow-xl">
                <div className="text-center mb-8">
                    <Shield className="mx-auto h-12 w-12 text-ex-navy" />
                    <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">{t('auth.loginTitle')}</h2>
                    <p className="mt-2 text-sm text-gray-600">{t('auth.loginSubtitle')}</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.email')}</label>
                        <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.password')}</label>
                        <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
                    </div>

                    <button id="login-submit" type="submit" disabled={loading} className="btn-secondary w-full flex justify-center py-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        {loading ? t('auth.authenticating') : <><LogIn className="w-5 h-5 mr-2" /> {t('auth.signIn')}</>}
                    </button>

                    <div className="text-center text-sm mt-4">
                        <span className="text-gray-600">{t('auth.newCitizen')} </span>
                        <Link to="/register" className="font-bold text-ex-cyan hover:underline">{t('auth.createAccount')}</Link>
                    </div>
                </form>

                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
                    <p className="font-bold mb-1">Demo Credentials</p>
                    <p>Citizen: citizen@test.com / Test@123</p>
                    <p>Admin: admin@exposex.com / Admin@123</p>
                </div>
            </div>
        </div>
    );
}
