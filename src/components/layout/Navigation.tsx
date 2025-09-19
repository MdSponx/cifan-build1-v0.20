import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAuthFlow } from '../auth/AuthFlowProvider';
import RoleBasedMenuItems from './RoleBasedMenuItems';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showCityRallyMenu, setShowCityRallyMenu] = useState(false);
  const [showCompetitionMenu, setShowCompetitionMenu] = useState(false);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, userProfile, isAuthenticated, signOut } = useAuth();
  const { setRedirectIntent } = useAuthFlow();
  
  // Get current language with fallback
  const currentLanguage = (i18n.language || 'en') as 'en' | 'th';
  
  // Dynamic typography classes based on language
  const getTypographyClass = (baseClass: string) => {
    return i18n.language === 'th' ? `${baseClass}-th` : `${baseClass}-en`;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smart positioning for dropdown
  useEffect(() => {
    // Removed smart positioning - always open downward
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const authButton = document.querySelector('[data-auth-button]');
      const dropdown = document.querySelector('[data-auth-dropdown]');
      
      if (showAuthMenu && 
          authButton && !authButton.contains(event.target as Node) &&
          dropdown && !dropdown.contains(event.target as Node)) {
        setShowAuthMenu(false);
      }
    };

    if (showAuthMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAuthMenu]);
  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'th' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowAuthMenu(false);
      window.location.hash = '#home';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Smart navigation for protected routes
  const handleProtectedNavigation = (route: string) => {
    if (!isAuthenticated) {
      setRedirectIntent(route);
      window.location.hash = '#auth/signin';
    } else {
      window.location.hash = route;
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#110D16]/90 backdrop-blur-xl border-b border-[#3B6891]/30' 
        : 'bg-transparent'
    } z-60`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2Flogo%20cifan%20full%404x.png?alt=media&token=9087f171-7499-40c5-a849-b09106f84a98"
              alt="CIFAN 2025 Logo"
              className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain filter brightness-0 invert"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center">
            {/* Main Navigation Links */}
            <div className="flex items-center space-x-6 xl:space-x-8 mr-8">
              <NavLink href="#home" active>{t('navigation.home')}</NavLink>
              <NavLink href="#about">{t('navigation.about')}</NavLink>
              <NavLink href="#public/feature-films">{t('navigation.featureFilms') || 'Feature Films'}</NavLink>
              
              {/* Competition Dropdown */}
              <div className="relative">
                <button 
                  className={`font-rsu ${getTypographyClass('nav')} transition-colors duration-300 hover:text-[#FCB283] text-white/80 flex items-center gap-1`}
                  onClick={() => setShowCompetitionMenu(!showCompetitionMenu)}
                  onMouseEnter={() => setShowCompetitionMenu(true)}
                  onMouseLeave={() => setShowCompetitionMenu(false)}
                >
                  {t('navigation.competition')}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showCompetitionMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Competition Dropdown Menu */}
                {showCompetitionMenu && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-56 glass-container rounded-xl p-2 border border-white/20 z-50"
                    onMouseEnter={() => setShowCompetitionMenu(true)}
                    onMouseLeave={() => setShowCompetitionMenu(false)}
                  >
                    <a 
                      href="#competition"
                      className={`block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                    >
                      <span>🏆</span>
                      {t('navigation.competition')}
                    </a>
                    <a 
                      href="#selected-short-films"
                      className={`block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                    >
                      <span>🎬</span>
                      Selected Short Films
                    </a>
                    <a 
                      href="#short-film-programs"
                      className={`block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                    >
                      <span>📋</span>
                      Short Film Programs
                    </a>
                  </div>
                )}
              </div>
              
              {/* Schedule Dropdown */}
              <div className="relative">
                <button 
                  className={`font-rsu ${getTypographyClass('nav')} transition-colors duration-300 hover:text-[#FCB283] text-white/80 flex items-center gap-1`}
                  onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                  onMouseEnter={() => setShowScheduleMenu(true)}
                  onMouseLeave={() => setShowScheduleMenu(false)}
                >
                  {t('navigation.schedule') || 'Schedule'}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showScheduleMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Schedule Dropdown Menu */}
                {showScheduleMenu && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-56 glass-container rounded-xl p-2 border border-white/20 z-50"
                    onMouseEnter={() => setShowScheduleMenu(true)}
                    onMouseLeave={() => setShowScheduleMenu(false)}
                  >
                    <a 
                      href="#festival-schedule"
                      className={`block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                    >
                      <span>📅</span>
                      {t('navigation.schedule') || 'Schedule'}
                    </a>
                    <a 
                      href="#venues"
                      className={`block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                    >
                      <span>📍</span>
                      {t('navigation.venues') || 'Venues'} / สถานที่
                    </a>
                  </div>
                )}
              </div>
              <NavLink href="#activities">{t('navigation.events')}</NavLink>
              
              {/* City Rally Dropdown */}
              <div className="relative">
                <button 
                  className={`font-rsu ${getTypographyClass('nav')} transition-colors duration-300 hover:text-[#FCB283] text-white/80 flex items-center gap-1`}
                  onClick={() => setShowCityRallyMenu(!showCityRallyMenu)}
                  onMouseEnter={() => setShowCityRallyMenu(true)}
                  onMouseLeave={() => setShowCityRallyMenu(false)}
                >
                  {t('navigation.cityRally')}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showCityRallyMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* City Rally Dropdown Menu */}
                {showCityRallyMenu && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-48 glass-container rounded-xl p-2 border border-white/20 z-50"
                    onMouseEnter={() => setShowCityRallyMenu(true)}
                    onMouseLeave={() => setShowCityRallyMenu(false)}
                  >
                    <a 
                      href="#city-rally"
                      className={`block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                    >
                      <span>🎪</span>
                      {t('navigation.cityRally')}
                    </a>
                    <a 
                      href="#city-rally-maps"
                      className={`block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                    >
                      <span>🗺️</span>
                      {t('navigation.cityRallyMaps')}
                    </a>
                  </div>
                )}
              </div>
              
              <NavLink href="#news">{t('navigation.news')}</NavLink>
            </div>
            
            {/* User Controls Group */}
            <div className="flex items-center space-x-2">
              {/* Language Switcher */}
              <button 
                onClick={toggleLanguage}
                className="liquid-glass-button-circle"
              >
                {t('navigation.language')}
              </button>
              
              {/* Auth Button with Dropdown */}
              <div className="relative">
                <button 
                  data-auth-button
                  className="liquid-glass-button-pill"
                  onClick={() => setShowAuthMenu(!showAuthMenu)}
                >
                  {isAuthenticated ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-[#FCB283] flex items-center justify-center">
                      {userProfile?.photoURL ? (
                        <img
                          src={userProfile.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-white font-bold">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <User size={16} className="text-white/80" />
                  )}
                </button>
              
                {/* Auth Dropdown */}
                {showAuthMenu && (
                  <div 
                    data-auth-dropdown
                    className="w-48 glass-container rounded-xl p-2 border border-white/20 max-h-80 overflow-y-auto"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '8px',
                      zIndex: 99999,
                      transform: 'none',
                      bottom: 'auto'
                    }}
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-white/20 mb-2">
                          <p className={`text-white/90 ${getTypographyClass('nav')} text-sm font-medium`}>
                            {user?.displayName || user?.email}
                          </p>
                          <p className={`text-white/60 ${getTypographyClass('nav')} text-xs`}>
                            {user?.email}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setShowAuthMenu(false);
                            handleProtectedNavigation('#profile/edit');
                          }}
                          className={`w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                        >
                          <span>👤</span>
                          {t('navigation.profile') || 'Profile'}
                        </button>
                        <button 
                          onClick={() => {
                            setShowAuthMenu(false);
                            handleProtectedNavigation('#my-applications');
                          }}
                          className={`w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                        >
                          <span>📋</span>
                          {t('navigation.myApplications') || 'My Applications'}
                        </button>
                        
                        {/* Admin Zone Access - Only show for admin users */}
                        {(userProfile?.role === 'admin' || userProfile?.role === 'super-admin') && user?.emailVerified ? (
                          <button 
                            onClick={() => {
                              setShowAuthMenu(false);
                              handleProtectedNavigation('#admin/dashboard');
                            }}
                            className={`w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2 border-l-2 border-[#FCB283]`}
                          >
                            <span>🛡️</span>
                            {currentLanguage === 'th' ? 'พื้นที่ผู้ดูแล' : 'Admin Zone'}
                          </button>
                        ) : null}
                        
                        {/* Role-based Menu Items */}
                        <RoleBasedMenuItems onMenuItemClick={() => setShowAuthMenu(false)} />
                        
                        <div className="border-t border-white/20 my-2"></div>
                        <button 
                          onClick={handleSignOut}
                          className={`w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                        >
                          <span>🚪</span>
                          {t('navigation.signOut') || 'Sign Out'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setShowAuthMenu(false);
                            window.location.hash = '#auth/signin';
                          }}
                          className={`w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                        >
                          <span>🔑</span>
                          {t('navigation.signIn')}
                        </button>
                        <button 
                          onClick={() => {
                            setShowAuthMenu(false);
                            window.location.hash = '#auth/signup';
                          }}
                          className={`w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                        >
                          <span>👤</span>
                          {t('navigation.signUp')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Menu Button */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* Mobile Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="liquid-glass-button-circle"
            >
              {t('navigation.language')}
            </button>
            
            {/* Mobile Menu Button */}
            <button 
              className="glass-button p-2 rounded-lg"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <span className={`block w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed inset-x-0 top-16 sm:top-20 z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="bg-black/50 backdrop-blur-sm min-h-screen p-4">
            <div className="glass-container rounded-2xl p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
            <MobileNavLink href="#home">{t('navigation.home')}</MobileNavLink>
            <MobileNavLink href="#about">{t('navigation.about')}</MobileNavLink>
            <MobileNavLink href="#public/feature-films">{t('navigation.featureFilms') || 'Feature Films'}</MobileNavLink>
            
            {/* Competition Section - Mobile */}
            <div className="py-2">
              <MobileNavLink href="#competition">
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  {t('navigation.competition')}
                </div>
              </MobileNavLink>
              <div className="ml-6 mt-1">
                <MobileNavLink href="#selected-short-films">
                  <div className="flex items-center gap-2 text-sm">
                    <span>🎬</span>
                    Selected Short Films
                  </div>
                </MobileNavLink>
                <MobileNavLink href="#short-film-programs">
                  <div className="flex items-center gap-2 text-sm">
                    <span>📋</span>
                    Short Film Programs
                  </div>
                </MobileNavLink>
              </div>
            </div>
            
            {/* Schedule Section - Mobile */}
            <div className="py-2">
              <MobileNavLink href="#festival-schedule">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  {t('navigation.schedule') || 'Schedule'}
                </div>
              </MobileNavLink>
              <div className="ml-6 mt-1">
                <MobileNavLink href="#venues">
                  <div className="flex items-center gap-2 text-sm">
                    <span>📍</span>
                    {t('navigation.venues') || 'Venues'} / สถานที่
                  </div>
                </MobileNavLink>
              </div>
            </div>
            
            <MobileNavLink href="#activities">{t('navigation.events')}</MobileNavLink>
            
            {/* City Rally Section - Mobile */}
            <div className="py-2">
              <MobileNavLink href="#city-rally">
                <div className="flex items-center gap-2">
                  <span>🎪</span>
                  {t('navigation.cityRally')}
                </div>
              </MobileNavLink>
              <div className="ml-6 mt-1">
                <MobileNavLink href="#city-rally-maps">
                  <div className="flex items-center gap-2 text-sm">
                    <span>🗺️</span>
                    {t('navigation.cityRallyMaps')}
                  </div>
                </MobileNavLink>
              </div>
            </div>
            
            <MobileNavLink href="#news">{t('navigation.news')}</MobileNavLink>
            
            <div className="border-t border-white/20 pt-4 mt-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-center py-3 bg-white/5 rounded-lg mb-3">
                    <p className={`text-white/90 ${getTypographyClass('nav')} text-sm`}>
                      {user?.displayName || user?.email}
                    </p>
                    <p className={`text-white/60 ${getTypographyClass('nav')} text-xs mt-1`}>
                      {user?.email}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      handleProtectedNavigation('#profile/edit');
                    }}
                    className={`w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                  >
                    <User size={16} />
                    {t('navigation.profile') || 'Profile'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      handleProtectedNavigation('#my-applications');
                    }}
                    className={`w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                  >
                    <span className="text-sm">📋</span>
                    {t('navigation.myApplications') || 'My Applications'}
                  </button>
                  
                  {/* Role-based Menu Items - Mobile */}
                  <RoleBasedMenuItems onMenuItemClick={() => setIsOpen(false)} />
                  
                  {/* Admin Zone Access - Mobile */}
                  {(userProfile?.role === 'admin' || userProfile?.role === 'super-admin') && user?.emailVerified ? (
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        handleProtectedNavigation('#admin/dashboard');
                      }}
                      className={`w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2 border-l-2 border-[#FCB283]`}
                    >
                      <span className="text-sm">🛡️</span>
                      {currentLanguage === 'th' ? 'พื้นที่ผู้ดูแล' : 'Admin Zone'}
                    </button>
                  ) : null}
                  
                  <button 
                    onClick={handleSignOut}
                    className={`w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                  >
                    <LogOut size={16} />
                    {t('navigation.signOut') || 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      window.location.hash = '#auth/signin';
                    }}
                    className={`w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                  >
                    <span className="text-sm">🔑</span>
                    {t('navigation.signIn')}
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      window.location.hash = '#auth/signup';
                    }}
                    className={`w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors ${getTypographyClass('nav')} flex items-center gap-2`}
                  >
                    <User size={16} />
                    {t('navigation.signUp')}
                  </button>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) => {
  const { i18n } = useTranslation();
  const getTypographyClass = (baseClass: string) => {
    return i18n.language === 'th' ? `${baseClass}-th` : `${baseClass}-en`;
  };
  
  return (
  <a 
    href={href} 
    className={`font-rsu ${getTypographyClass('nav')} transition-colors duration-300 hover:text-[#FCB283] ${
      active ? 'text-[#FCB283]' : 'text-white/80'
    }`}
  >
    {children}
  </a>
  );
};

const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const getTypographyClass = (baseClass: string) => i18n.language === 'th' ? `${baseClass}-th` : `${baseClass}-en`;
  
  return (
  <a 
    href={href}
    className={`block py-2 text-white/80 hover:text-[#FCB283] transition-colors duration-300 ${getTypographyClass('nav')}`}
  >
    {children}
  </a>
  );
};

export default Navigation;
