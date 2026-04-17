import React, { useEffect, useState } from 'react';
import { Award, ShieldCheck, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { getReports } from '../storage';

const Profile = () => {
    const { t } = useTranslation();
    const { user } = useStore();
    const [profileStats, setProfileStats] = useState({ reportCount: 0, badges: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        
        // Simulate profile data fetch from storage
        setTimeout(() => {
            const allReports = getReports();
            const myReports = allReports.filter(r => r.citizenId === user.id);
            
            // Dynamic badge logic
            const badges = [];
            if (myReports.length > 0) badges.push('First Step');
            if (myReports.length >= 3) badges.push('Justice Seeker');
            if (myReports.some(r => r.status === 'Resolved')) badges.push('RTI Warrior');

            setProfileStats({
                reportCount: myReports.length,
                badges: badges
            });
            setLoading(false);
        }, 500);
    }, [user]);

    const BADGE_DESCRIPTIONS = {
        'First Step': t('badges.First Step') || 'Filed your first report.',
        'Witness': t('badges.Witness') || 'Validated a report as a witness.',
        'RTI Warrior': t('badges.RTI Warrior') || 'Successfully resolved a case.',
        'Justice Seeker': t('badges.Justice Seeker') || 'Filed 3 or more reports.'
    };

    if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 text-ex-navy animate-spin mx-auto" /></div>;

    if (!user) return <div className="text-center py-20 text-gray-500">{t('auth.loginSubtitle')}</div>;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
             <div className="bg-ex-navy rounded-t-3xl p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute opacity-10 right-0 top-0 mt-[-40px] mr-[-40px]">
                    <ShieldCheck className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center md:space-x-8">
                    <div className="w-28 h-28 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center text-white shadow-inner mb-6 md:mb-0">
                        <UserIcon className="w-14 h-14" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-display font-bold mb-1">{user.name}</h1>
                        <p className="text-ex-cyan flex items-center justify-center md:justify-start font-medium"><Mail className="w-4 h-4 mr-2"/> {user.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            <span className="px-4 py-1.5 bg-ex-cyan text-ex-navy text-xs font-black rounded-full uppercase tracking-widest shadow-lg">
                                {user.role} {t('profile.accountLabel')}
                            </span>
                            <span className="px-4 py-1.5 bg-white/10 text-white text-xs font-black rounded-full uppercase tracking-widest border border-white/20">
                                {profileStats.reportCount} Reports Filed
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-b-3xl border border-gray-200 border-t-0 p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-ex-navy mb-8 flex items-center border-b border-gray-100 pb-5">
                    <Award className="w-7 h-7 mr-3 text-ex-cyan" /> {t('profile.badgesTitle')}
                </h2>
                
                {profileStats.badges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profileStats.badges.map((badge, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start shadow-sm hover:shadow-md transition-shadow group">
                                <div className="bg-white p-4 rounded-2xl shadow-sm mr-5 shrink-0 group-hover:bg-ex-cyan transition-colors">
                                    <Award className="w-10 h-10 text-ex-cyan group-hover:text-ex-navy transition-colors" />
                                </div>
                                <div className="pt-1">
                                    <h3 className="font-bold text-ex-navy text-xl">{t(`badges.${badge}`) || badge}</h3>
                                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{BADGE_DESCRIPTIONS[badge] || t('badges.default')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Award className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">{t('profile.noBadges')}</h3>
                        <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">{t('profile.noBadgesNote')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
