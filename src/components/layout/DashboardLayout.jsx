import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';

export default function DashboardLayout() {
    const { currentUser, logout } = useAuth();
    const { profileData, metrics, loading, error } = useUserProfile();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const navItems = [
        { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '/explorer', icon: 'explore', label: 'Explorer' },
        { path: '/analysis', icon: 'query_stats', label: 'Analysis' },
        { path: '/budgets', icon: 'account_balance_wallet', label: 'Budgets' },
        { path: '/settings', icon: 'settings', label: 'Settings' }
    ];

    return (
        <div className="bg-background text-on-surface font-body-md min-h-screen flex selection:bg-primary-container selection:text-white">
            
            {/* SideNavBar */}
            <nav className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest/90 backdrop-blur-2xl border-r border-white/5 flex-col p-gutter space-y-unit hidden md:flex z-50">
                <div className="mb-8 mt-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                        </div>
                        <div>
                            <h1 className="font-headline-md text-headline-md text-primary font-bold tracking-tight">SpendWise AI</h1>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">SpendWise AI</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 space-y-2">
                    {navItems.map(item => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                    isActive 
                                    ? 'bg-primary/10 text-primary border-r-4 border-primary' 
                                    : 'text-on-surface-variant hover:bg-white/5 hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                                <span className="font-label-md text-label-md">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
                
                <button className="mt-auto w-full py-3 bg-primary-container text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors shadow-[0_0_30px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    Analyze Purchase
                </button>
            </nav>

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                
                {/* TopNavBar */}
                <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-8">
                    <div className="relative w-96 hidden sm:block">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input 
                            type="text" 
                            placeholder="Search transactions, insights..." 
                            className="w-full bg-surface-container-high border-none rounded-full py-2.5 pl-12 pr-4 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none font-body-md text-body-md placeholder:text-on-surface-variant"
                        />
                    </div>
                    
                    <div className="flex items-center gap-6 ml-auto">
                        <button className="relative text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden lg:block">
                                <p className="font-label-md text-label-md text-on-surface">
                                    {profileData?.userDoc?.fullName || currentUser?.displayName || 'SpendWise User'}
                                </p>
                                <p className="font-label-sm text-label-sm text-primary capitalize">
                                    {profileData?.userDoc?.subscriptionTier || 'Free'} Tier
                                </p>
                            </div>
                            <div className="group relative">
                                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-white/10 overflow-hidden flex items-center justify-center cursor-pointer">
                                    {currentUser?.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-on-surface-variant">person</span>
                                    )}
                                </div>
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-high border border-white/10 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 font-body-md text-sm text-error hover:bg-white/5 rounded-xl flex items-center gap-2 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main View Outlet */}
                <div className="flex-1">
                    <Outlet context={{ profileData, metrics, loading, error }} />
                </div>
            </div>
        </div>
    );
}
