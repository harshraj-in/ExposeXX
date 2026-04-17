import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';

const ADMIN_EMAIL = 'admin@exposex.com';
const ADMIN_PASSWORD = 'Admin@123';

const AdminLogin = () => {
    const { t } = useTranslation();
    const { register, handleSubmit } = useForm();
    const [loading, setLoading] = useState(false);
    const { setUser } = useStore();
    const navigate = useNavigate();

    const onSubmit = (data) => {
        setLoading(true);
        // Simulate slight delay for UX, then check hardcoded credentials
        setTimeout(() => {
            if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
                const adminUser = {
                    id: 'admin_001',
                    name: 'System Admin',
                    email: ADMIN_EMAIL,
                    role: 'Admin',
                };
                setUser(adminUser);
                toast.success('Admin access granted');
                navigate('/admin/dashboard');
            } else {
                toast.error('Invalid admin credentials');
            }
            setLoading(false);
        }, 600);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50 items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-8 shadow-2xl border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-ex-navy w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Shield className="h-8 w-8 text-ex-cyan" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-ex-navy">{t('auth.adminLoginTitle')}</h2>
                    <p className="text-sm text-gray-500 mt-2">{t('auth.adminLoginSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                        <input
                            {...register('email')}
                            id="admin-email"
                            type="email"
                            required
                            className="input-field bg-gray-50 focus:bg-white"
                            placeholder="admin@exposex.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                        <input
                            {...register('password')}
                            id="admin-password"
                            type="password"
                            required
                            className="input-field bg-gray-50 focus:bg-white"
                        />
                    </div>

                    <button
                        id="admin-submit"
                        type="submit"
                        disabled={loading}
                        className="w-full btn-secondary py-3 flex justify-center items-center font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('auth.signIn')}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-4">Secured by ExposeX Moderation Protocol</p>
                </form>

                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                    <p className="font-bold">Demo: admin@exposex.com / Admin@123</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
