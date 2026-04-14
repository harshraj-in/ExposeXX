import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import { UserPlus, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { setUser } = useStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await apiClient.post('/auth/register', formData);
            setUser(res.data);
            toast.success("Account created securely!");
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full glass-card p-8 shadow-xl">
                <div className="text-center mb-8">
                    <Shield className="mx-auto h-12 w-12 text-ex-navy" />
                    <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">{t('auth.registerTitle')}</h2>
                    <p className="mt-2 text-sm text-gray-600">{t('auth.registerSubtitle')}</p>
                </div>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.fullName')}</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.email')}</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.phone') || 'Phone Number'}</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('auth.password')}</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field" />
                    </div>
                    
                    <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center py-3 mt-6 bg-ex-navy">
                        {loading ? t('auth.creating') || 'Creating...' : <><UserPlus className="w-5 h-5 mr-2" /> {t('auth.register')}</>}
                    </button>
                    
                    <div className="text-center text-sm mt-4">
                        <span className="text-gray-600">{t('auth.alreadyCitizen')} </span>
                        <Link to="/login" className="font-bold text-ex-cyan hover:underline">{t('nav.home')}</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
