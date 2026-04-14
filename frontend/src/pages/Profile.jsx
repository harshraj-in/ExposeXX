import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Award, ShieldCheck, Mail, User as UserIcon } from 'lucide-react';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';

const Profile = () => {
    const { t } = useTranslation();
    const { user } = useStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get('/auth/profile');
                setProfile(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const BADGE_DESCRIPTIONS = {
        'First Step': t('badges.First Step'),
        'Witness': t('badges.Witness'),
        'RTI Warrior': t('badges.RTI Warrior'),
        'Justice Seeker': t('badges.Justice Seeker')
    };

    if (loading) return <div className="text-center py-20"><div className="w-10 h-10 border-4 border-cw-navy border-t-cw-saffron rounded-full animate-spin mx-auto"></div></div>;

    if (!user) return <div className="text-center py-20">{t('auth.loginSubtitle')}</div>; // Fallback or specific login req msg

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
             <div className="bg-cw-navy rounded-t-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute opacity-10 right-0 top-0 mt-[-20px] mr-[-20px]">
                    <ShieldCheck className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex items-center space-x-6">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-cw-navy shadow-inner cursor-default">
                        <UserIcon className="w-12 h-12" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold">{profile?.name || user.name}</h1>
                        <p className="text-gray-300 flex items-center mt-1"><Mail className="w-4 h-4 mr-2"/> {profile?.email || user.email}</p>
                        <span className="inline-block mt-3 px-3 py-1 bg-cw-saffron text-cw-navy text-xs font-bold rounded-full uppercase tracking-wide">
                            {profile?.role || user.role} {t('profile.accountLabel')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-t-none border border-t-0 border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-cw-navy mb-6 flex items-center border-b pb-4">
                    <Award className="w-6 h-6 mr-2 text-cw-saffron" /> {t('profile.badgesTitle')}
                </h2>
                
                {profile?.badges?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.badges.map((badge, idx) => (
                            <div key={idx} className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start shadow-sm">
                                <div className="bg-white p-3 rounded-full shadow-sm mr-4 shrink-0">
                                    <Award className="w-8 h-8 text-cw-saffron" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-cw-navy text-lg">{t(`badges.${badge}`) || badge}</h3>
                                    <p className="text-sm text-gray-600 mt-1 leading-tight">{BADGE_DESCRIPTIONS[badge] || t('badges.default')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-500">{t('profile.noBadges')}</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">{t('profile.noBadgesNote')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
