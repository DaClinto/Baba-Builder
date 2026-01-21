'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Mock user creation for the session
        const mockUser = {
            id: Math.random().toString(36).substr(2, 9),
            name: isLogin ? 'Returning Visionary' : 'New Creator',
            color: '#3b82f6'
        };

        sessionStorage.setItem('figma-clone-user', JSON.stringify(mockUser));
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white flex overflow-hidden font-sans">
            {/* Left Side: Hero Section */}
            <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-12 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-violet-600/20" />
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-2xl text-center lg:text-left"
                >
                    <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase">Baba Builder</h2>
                    </div>

                    <h1 className="text-6xl xl:text-7xl font-black leading-tight mb-6 bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                        Create your next <br />
                        <span className="text-blue-500 underline decoration-blue-500/30 decoration-8 underline-offset-8">masterpiece</span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-lg">
                        The professional collaborative design platform for modern teams. Built for speed, precision, and boundless creativity.
                    </p>

                    {/* Floating Mockup UI */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl shadow-black/50 overflow-hidden group"
                    >
                        <img
                            src="/assets/hero.png"
                            alt="Design Interface"
                            className="rounded-2xl shadow-inner transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-40" />
                    </motion.div>
                </motion.div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-8 relative">
                {/* Mobile Background Elements */}
                <div className="lg:hidden absolute inset-0 -z-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-3xl font-bold mb-2">
                            {isLogin ? 'Welcome back' : 'Join the elite'}
                        </h3>
                        <p className="text-gray-400">
                            {isLogin ? "Ready to continue your masterpiece?" : "Start your journey to creative excellence."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-1.5"
                                >
                                    <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-600"
                                            required
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                {isLogin && (
                                    <button type="button" className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors">
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 group mt-2"
                        >
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="my-8 flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Or continue with</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl font-medium transition-all group">
                            <Chrome className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl font-medium transition-all group">
                            <Github className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                            GitHub
                        </button>
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-gray-400">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-blue-500 hover:text-blue-400 font-bold transition-colors"
                            >
                                {isLogin ? 'Get started for free' : 'Log in here'}
                            </button>
                        </p>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-center gap-8 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                        <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Support</a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
