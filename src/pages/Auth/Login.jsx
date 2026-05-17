import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, loginWithApple } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const credential = await login(email, password);
            const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
            if (userDoc.exists() && userDoc.data().onboardingCompleted) {
                navigate('/dashboard');
            } else {
                navigate('/onboarding/step1');
            }
        } catch (err) {
            setError('Failed to log in: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        try {
            setError('');
            setLoading(true);
            const credential = await loginWithGoogle();
            const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
            if (userDoc.exists() && userDoc.data().onboardingCompleted) {
                navigate('/dashboard');
            } else {
                navigate('/onboarding/step1');
            }
        } catch (err) {
            setError('Failed to log in with Google: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex w-full min-h-screen bg-background text-on-surface">
            {/* Form Side */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-container-margin py-section-gap relative z-10">
                
                {/* Logo / Top Nav (Minimal for Auth) */}
                <div className="absolute top-0 left-0 w-full p-container-margin flex justify-start">
                    <Link to="/" className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                        SpendWise AI
                    </Link>
                </div>
                
                {/* Login Container */}
                <div className="w-full max-w-md space-y-8 bg-surface-container-lowest/90 backdrop-blur-2xl p-card-padding rounded-xl border border-white/5 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden">
                    {/* Subtle Top Gradient for Glass effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Welcome back</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant">Sign in to access your obsidian intelligence dashboard.</p>
                    </div>
                    
                    {error && <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm">{error}</div>}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="sr-only" htmlFor="email">Email address</label>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <input 
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body-md text-body-md" 
                                    id="email" name="email" placeholder="Email address" required type="email"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <label className="sr-only" htmlFor="password">Password</label>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <input 
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body-md text-body-md" 
                                    id="password" name="password" placeholder="Password" required type="password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary focus:ring-offset-background" id="remember-me" name="remember-me" type="checkbox"/>
                                <label className="ml-2 block font-label-md text-label-md text-on-surface-variant" htmlFor="remember-me">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a className="font-label-md text-label-md text-primary hover:text-primary-fixed transition-colors" href="#">
                                    Forgot password?
                                </a>
                            </div>
                        </div>
                        
                        <div>
                            <button disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-primary-container hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background font-label-md text-label-md shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] disabled:opacity-50" type="submit">
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-white/70 group-hover:text-white transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                                </span>
                                Sign In
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">Or continue with</span>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div>
                                <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex justify-center items-center py-2 px-4 border border-white/10 rounded-lg shadow-sm bg-white/5 font-label-md text-label-md text-on-surface hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined mr-2 text-on-surface-variant">account_circle</span>
                                    Google
                                </button>
                            </div>
                            <div>
                                <button disabled={loading} className="w-full flex justify-center items-center py-2 px-4 border border-white/10 rounded-lg shadow-sm bg-white/5 font-label-md text-label-md text-on-surface hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined mr-2 text-on-surface-variant">apple</span>
                                    Apple
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <p className="mt-8 text-center font-body-md text-body-md text-on-surface-variant">
                        Don't have an account? 
                        <Link className="font-label-md text-label-md text-primary hover:text-primary-fixed transition-colors ml-1" to="/signup">Sign up</Link>
                    </p>
                </div>
            </div>
            
            {/* Visual Side (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-low overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary-container/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiM0ZWRlYTMiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] [mask-image:linear-gradient(to_bottom_right,white,transparent)] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col justify-center items-start w-full h-full p-section-gap text-on-surface max-w-2xl mx-auto">
                    <div className="space-y-6 backdrop-blur-xl bg-surface-container-lowest/40 p-10 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label-sm text-label-sm text-primary">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            System Online
                        </span>
                        <h2 className="font-display-lg text-display-lg font-bold leading-tight">
                            Obsidian Intelligence <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">for your finances.</span>
                        </h2>
                        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                            Experience the next generation of financial automation. Deep learning models analyze your spending patterns to optimize wealth creation with unparalleled privacy.
                        </p>
                        
                        <div className="mt-10 grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md flex flex-col gap-2">
                                <span className="material-symbols-outlined text-primary">monitoring</span>
                                <span className="font-label-md text-label-md text-on-surface-variant">Real-time Analysis</span>
                                <span className="font-headline-md text-headline-md text-on-surface">+24.5%</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md flex flex-col gap-2">
                                <span className="material-symbols-outlined text-primary">security</span>
                                <span className="font-label-md text-label-md text-on-surface-variant">Encrypted Vault</span>
                                <span className="font-headline-md text-headline-md text-on-surface">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
