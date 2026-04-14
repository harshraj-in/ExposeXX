import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, LogOut, LayoutDashboard, Map, Info, Search, Activity, Languages, Trophy, User, Users } from 'lucide-react';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  return (
    <nav className="bg-ex-navy text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <ShieldCheck className="h-8 w-8 text-ex-cyan mr-2" />
            <span className="font-display font-bold text-xl tracking-wide select-none">
              Expose<span className="text-ex-cyan">X</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 justify-center space-x-4 items-center text-sm lg:text-base">
            <Link to="/feed" className="hover:text-ex-cyan px-3 py-2 rounded-md font-medium flex items-center transition-all hover:scale-105">
              <Activity className="h-4 w-4 mr-1"/> {t('nav.feed')}
            </Link>
            <Link to="/report" className="hover:text-ex-cyan px-3 py-2 rounded-md font-medium flex items-center transition-all hover:scale-105">
              <Info className="h-4 w-4 mr-1"/> {t('nav.report')}
            </Link>
            <Link to="/track" className="hover:text-ex-cyan px-3 py-2 rounded-md font-medium flex items-center transition-all hover:scale-105">
              <Search className="h-4 w-4 mr-1"/> {t('nav.track')}
            </Link>
            <Link to="/map" className="hover:text-ex-cyan px-3 py-2 rounded-md font-medium flex items-center transition-all hover:scale-105">
              <Map className="h-4 w-4 mr-1"/> {t('nav.map')}
            </Link>
            <Link to="/scoreboard" className="hover:text-ex-cyan px-3 py-2 rounded-md font-medium flex items-center transition-all hover:scale-105">
              <Trophy className="h-4 w-4 mr-1"/> {t('nav.scoreboard')}
            </Link>
          </div>

          {/* Auth & Tools Section */}
          <div className="hidden md:flex items-center space-x-3">
            <button onClick={toggleLanguage} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded transition flex items-center">
              <Languages className="h-4 w-4 mr-1"/> {i18n.language.toUpperCase()}
            </button>

            {user ? (
              <>
                {user.role !== 'Citizen' && (
                  <Link to="/admin/dashboard" className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded transition flex items-center">
                     <LayoutDashboard className="h-4 w-4 mr-1"/> {t('nav.dashboard')}
                  </Link>
                )}
                {user.role === 'Citizen' && (
                  <Link to="/dashboard" className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded transition flex items-center">
                     <LayoutDashboard className="h-4 w-4 mr-1"/> {t('nav.dashboard')}
                  </Link>
                )}
                {user.role === 'NGO' && (
                  <Link to="/ngo-portal" className="text-sm bg-green-600/20 hover:bg-green-600/40 text-green-300 font-bold px-3 py-2 rounded transition flex items-center">
                     <Users className="h-4 w-4 mr-1"/> NGO Portal
                  </Link>
                )}
                <button onClick={handleLogout} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition flex items-center">
                  <LogOut className="h-4 w-4 mr-1"/> {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary text-xs px-4 py-2 hover:scale-105 active:scale-95 transition-all">
                  <User className="h-4 w-4 mr-1"/> {t('auth.signIn')}
                </Link>
                <Link to="/admin/login" className="text-[11px] text-gray-400 hover:text-ex-cyan border border-gray-100/10 hover:border-ex-cyan/30 px-3 py-1.5 rounded-full transition-all bg-white/5 font-bold uppercase tracking-wider">
                  {t('nav.adminLogin')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
