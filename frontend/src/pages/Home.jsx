import { ArrowRight, ShieldAlert, CheckCircle, TrendingUp, Search, Phone, Activity, Map } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';

const Home = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ total: 12450, resolved: 812, states: 28 });
    const [pulse, setPulse] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({ ...prev, total: prev.total + Math.floor(Math.random() * 3) }));
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                const res = await apiClient.get('/reports/pulse');
                setPulse(res.data);
            } catch (err) {
                console.error("Pulse error:", err);
            }
        };
        fetchPulse();
        const pulseInterval = setInterval(fetchPulse, 30000); // Poll every 30s
        return () => clearInterval(pulseInterval);
    }, []);

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative bg-ex-navy py-12 lg:py-24 overflow-hidden">

                <ParticleBackground />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight animate-fade-in-up">
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
                                <span className="font-bold text-yellow-300">{t('home.filedIn')} {p.location?.state || 'Unknown'}</span> — {p.category || 'Other'} • 
                                <span className="opacity-75 italic ml-1">
                                    {Math.max(1, Math.floor((new Date() - new Date(p.createdAt)) / 60000))} {t('home.minsAgo')}
                                </span>
                                <span className="mx-8 opacity-30">|</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Ticker */}
            <section className="bg-ex-cyan text-ex-navy py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-around text-center gap-4">
                    <div className="flex items-center font-bold text-lg"><TrendingUp className="mr-2"/> {t('home.totalReports')}: {stats.total}</div>
                    <div className="flex items-center font-bold text-lg"><CheckCircle className="mr-2"/> {t('home.casesResolved')}: {stats.resolved}</div>
                    <div className="flex items-center font-bold text-lg"><Map className="mr-2"/> {t('home.statesCovered')}: {stats.states}</div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12">{t('home.howTitle')}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        
                        <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow bg-gray-50">
                            <div className="bg-ex-navy text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
                            <h3 className="text-xl font-bold mb-2">{t('home.step1Title')}</h3>
                            <p className="text-gray-600">{t('home.step1Desc')}</p>
                        </div>

                        <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow bg-gray-50">
                            <div className="bg-ex-cyan text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
                            <h3 className="text-xl font-bold mb-2">{t('home.step2Title')}</h3>
                            <p className="text-gray-600">{t('home.step2Desc')}</p>
                        </div>

                        <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow bg-gray-50">
                            <div className="bg-ex-navy text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
                            <h3 className="text-xl font-bold mb-2">{t('home.step3Title')}</h3>
                            <p className="text-gray-600">{t('home.step3Desc')}</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Emergency Contacts */}
            <section className="py-16 bg-gray-100 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-8">{t('home.helplineTitle')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="font-bold text-ex-navy flex items-center justify-center mb-1"><Phone className="h-4 w-4 mr-1"/> {t('home.lokpal')}</div>
                            <div className="text-ex-cyan font-bold text-lg">1800-180-5656</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="font-bold text-ex-navy flex items-center justify-center mb-1"><Phone className="h-4 w-4 mr-1"/> {t('home.cbi')}</div>
                            <div className="text-ex-cyan font-bold text-lg">011-24368975</div>
                        </div>
                        <a href="https://pgportal.gov.in/" target="_blank" rel="noreferrer" className="bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-ex-navy">
                            {t('home.pmoPortal')} <ArrowRight className="ml-1 h-4 w-4"/>
                        </a>
                        <a href="https://rtionline.gov.in/" target="_blank" rel="noreferrer" className="bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-ex-navy">
                            {t('home.rtiPortal')} <ArrowRight className="ml-1 h-4 w-4"/>
                        </a>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;

