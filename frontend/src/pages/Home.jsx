import { ArrowRight, ShieldAlert, CheckCircle, TrendingUp, Search, Phone, Activity, Map } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import { getReports, getPulseData } from '../storage';

const Home = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ total: 0, resolved: 0, states: 0 });
    const [pulse, setPulse] = useState([]);

    useEffect(() => {
        const reports = getReports();
        const resolvedCount = reports.filter(r => r.status === 'Resolved' || r.status === 'Closed').length;
        const stateSet = new Set(reports.map(r => r.location?.state).filter(Boolean));
        
        setStats({
            total: 12450 + reports.length, // Base + actual reports
            resolved: 812 + resolvedCount,
            states: Math.max(28, stateSet.size)
        });
        
        setPulse(getPulseData());

        const interval = setInterval(() => {
            setStats(prev => ({ ...prev, total: prev.total + Math.floor(Math.random() * 2) }));
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const updatePulse = () => {
            setPulse(getPulseData());
        };
        const pulseInterval = setInterval(updatePulse, 30000); 
        return () => clearInterval(pulseInterval);
    }, []);

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative bg-ex-navy py-12 lg:py-24 overflow-hidden">

                <ParticleBackground />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight animate-fade-in-up">
                            {t('home.heroTitle')} <br/>
                            <span className="text-ex-cyan">{t('home.heroSubtitle')}</span>
                        </h1>
                        <p className="text-lg text-gray-300 mb-8 max-w-lg mx-auto md:mx-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            {t('home.heroDesc')}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <Link to="/report" className="btn-primary flex items-center justify-center text-lg bg-ex-cyan border-ex-cyan text-ex-navy hover:bg-cyan-500">
                                <ShieldAlert className="mr-2 h-5 w-5" /> {t('home.btnReport')}
                            </Link>
                            <Link to="/track" className="btn-outline border-gray-400 text-gray-200 hover:bg-white hover:text-ex-navy flex items-center justify-center text-lg">
                                <Search className="mr-2 h-5 w-5" /> {t('home.btnTrack')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Corruption Pulse Ticker */}
            {pulse.length > 0 && (
                <div className="bg-red-600 text-white py-2 overflow-hidden flex items-center shadow-inner border-y border-red-700 relative">
                    <div className="bg-red-700 px-4 py-2 text-sm font-bold absolute left-0 z-10 flex items-center h-full">
                        <Activity className="h-4 w-4 mr-2 animate-pulse" /> {t('home.livePulse')}
                    </div>
                    <div className="whitespace-nowrap flex pl-32 animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
                        {pulse.map((p, idx) => (
                            <span key={idx} className="mx-8 text-sm font-medium tracking-wide">
                                <span className="font-bold text-yellow-300 text-xs sm:text-sm">{t('home.filedIn')} {p.location?.state || 'Unknown'}</span> — {p.category || 'Other'} • 
                                <span className="opacity-75 italic ml-1">
                                    {Math.max(1, Math.floor((Date.now() - new Date(p.createdAt)) / 60000))} {t('home.minsAgo')}
                                </span>
                                <span className="mx-8 opacity-30">|</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Ticker */}
            <section className="bg-ex-cyan text-ex-navy py-4 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-around text-center gap-4">
                    <div className="flex items-center font-bold text-lg"><TrendingUp className="mr-2"/> {t('home.totalReports')}: {stats.total.toLocaleString()}</div>
                    <div className="flex items-center font-bold text-lg"><CheckCircle className="mr-2"/> {t('home.casesResolved')}: {stats.resolved.toLocaleString()}</div>
                    <div className="flex items-center font-bold text-lg"><Map className="mr-2"/> {t('home.statesCovered')}: {stats.states}</div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 dark:text-white">{t('home.howTitle')}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        
                        <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 group">
                            <div className="bg-ex-navy text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:bg-ex-cyan group-hover:text-ex-navy transition-colors">1</div>
                            <h3 className="text-xl font-bold mb-2 dark:text-white">{t('home.step1Title')}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{t('home.step1Desc')}</p>
                        </div>

                        <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 group">
                            <div className="bg-ex-cyan text-ex-navy w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:bg-ex-navy group-hover:text-white transition-colors">2</div>
                            <h3 className="text-xl font-bold mb-2 dark:text-white">{t('home.step2Title')}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{t('home.step2Desc')}</p>
                        </div>

                        <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 group">
                            <div className="bg-ex-navy text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:bg-ex-cyan group-hover:text-ex-navy transition-colors">3</div>
                            <h3 className="text-xl font-bold mb-2 dark:text-white">{t('home.step3Title')}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{t('home.step3Desc')}</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="py-24 bg-gray-50 dark:bg-slate-800/30 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-ex-navy dark:text-white mb-4">
                            {t('home.featuresTitle')}
                        </h2>
                        <div className="w-24 h-1.5 bg-ex-cyan mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {/* 1. Anonymous Reporting */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featAnonTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featAnonDesc')}</p>
                        </div>

                        {/* 2. AI Legal Advisor */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                                < TrendingUp className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featLegalTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featLegalDesc')}</p>
                        </div>

                        {/* 3. Evidence Upload */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featEvidenceTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featEvidenceDesc')}</p>
                        </div>

                        {/* 4. Real-time Tracking */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-4">
                                <Search className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featTrackTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featTrackDesc')}</p>
                        </div>

                        {/* 5. Safe Room Chat */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featSafeRoomTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featSafeRoomDesc')}</p>
                        </div>

                        {/* 6. Intelligence Map */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                                <Map className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featMapTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featMapDesc')}</p>
                        </div>

                        {/* 7. Scoreboard */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-4">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featScoreTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featScoreDesc')}</p>
                        </div>

                        {/* 8. Reward Wallet */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featWalletTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featWalletDesc')}</p>
                        </div>

                        {/* 9. Multilingual */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featMultiTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featMultiDesc')}</p>
                        </div>

                        {/* 10. Voice Reporting */}
                        <div className="glass-card p-6 premium-card-hover border-transparent hover:border-ex-cyan/30 dark:bg-slate-900/60 transition-all flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-lg flex items-center justify-center text-pink-600 dark:text-pink-400 mb-4">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 dark:text-white">{t('home.featVoiceTitle')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.featVoiceDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Emergency Contacts */}
            <section className="py-16 bg-gray-100 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-8 dark:text-white">{t('home.helplineTitle')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-transparent dark:border-slate-800">
                            <div className="font-bold text-ex-navy dark:text-gray-200 flex items-center justify-center mb-1"><Phone className="h-4 w-4 mr-1"/> {t('home.lokpal')}</div>
                            <div className="text-ex-cyan font-bold text-lg">1800-180-5656</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-transparent dark:border-slate-800">
                            <div className="font-bold text-ex-navy dark:text-gray-200 flex items-center justify-center mb-1"><Phone className="h-4 w-4 mr-1"/> {t('home.cbi')}</div>
                            <div className="text-ex-cyan font-bold text-lg">011-24368975</div>
                        </div>
                        <a href="https://pgportal.gov.in/" target="_blank" rel="noreferrer" className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-ex-navy dark:text-gray-200 border border-transparent dark:border-slate-800 transition-colors">
                            {t('home.pmoPortal')} <ArrowRight className="ml-1 h-4 w-4"/>
                        </a>
                        <a href="https://rtionline.gov.in/" target="_blank" rel="noreferrer" className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-ex-navy dark:text-gray-200 border border-transparent dark:border-slate-800 transition-colors">
                            {t('home.rtiPortal')} <ArrowRight className="ml-1 h-4 w-4"/>
                        </a>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
