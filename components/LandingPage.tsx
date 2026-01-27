'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Layers, Zap, Users, ShieldCheck, Github, Chrome } from 'lucide-react';
import Link from 'next/link';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 font-inter">
            {/* Artistic Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[160px] animate-pulse-soft" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[160px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase font-outfit">DrawToCreate</span>
                </div>

                <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <a href="#features" className="hover:text-white hover:tracking-[0.25em] transition-all">Features</a>
                    <a href="#showcase" className="hover:text-white hover:tracking-[0.25em] transition-all">Showcase</a>
                    <a href="#pricing" className="hover:text-white hover:tracking-[0.25em] transition-all">Pricing</a>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                        Log In
                    </Link>
                    <Link href="/login" className="bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-48 pb-24 px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Infinite Canvas v2.0 is live</span>
                        </div>

                        <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-black leading-[0.85] mb-12 font-outfit tracking-tighter">
                            Design at the <br />
                            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">speed of thought.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-400 mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
                            The collaborative, AI-powered design environment for high-performance teams. Boundless creativity meets pixel-perfect execution.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto premium-gradient text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-2xl shadow-blue-600/30 active:scale-95 group"
                            >
                                Create a Project
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </Link>
                            <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:border-white/20">
                                View Gallery
                            </button>
                        </div>
                    </motion.div>

                    {/* App Showcase */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 60 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="relative max-w-6xl mx-auto group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                        <div className="relative rounded-[2.5rem] border border-white/10 bg-[#020617] p-4 shadow-2xl overflow-hidden">
                            <img
                                src="/assets/hero.png"
                                alt="Figma Clone Interface"
                                className="rounded-[1.8rem] w-full border border-white/5"
                            />
                        </div>

                        {/* Floating Labels */}
                        <div className="absolute -left-16 top-1/4 hidden 2xl:block glass-panel p-6 rounded-[2rem] max-w-[200px] border-white/10 animate-float">
                            <Layers className="w-8 h-8 text-blue-500 mb-4" />
                            <h4 className="font-black font-outfit text-sm mb-1 uppercase tracking-wider">Smart Layers</h4>
                            <p className="text-[10px] text-gray-400 font-medium">Automatic grouping and professional stack management.</p>
                        </div>

                        <div className="absolute -right-16 bottom-1/4 hidden 2xl:block glass-panel p-6 rounded-[2rem] max-w-[200px] border-white/10 animate-float" style={{ animationDelay: '1.5s' }}>
                            <Zap className="w-8 h-8 text-yellow-500 mb-4" />
                            <h4 className="font-black font-outfit text-sm mb-1 uppercase tracking-wider">Fast Engine</h4>
                            <p className="text-[10px] text-gray-400 font-medium">Render 10k+ objects at 60fps with pure WebGL power.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-32 px-8 bg-black/20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: <Users className="text-blue-500" />, title: 'Real-time', desc: 'Work with your team live with sub-10ms cursor synchronization.' },
                            { icon: <Sparkles className="text-violet-500" />, title: 'AI Assisted', desc: 'Automate repetitive tasks like background removal with one click.' },
                            { icon: <Layers className="text-emerald-500" />, title: 'Components', desc: 'Build scalable design systems with reusable frames and styles.' },
                        ].map((f, i) => (
                            <div key={i} className="group p-8 rounded-[2rem] hover:bg-white/5 transition-all duration-500 border border-transparent hover:border-white/5">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all">
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-black font-outfit mb-4 tracking-tight">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed font-medium text-sm">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-12 group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 group-hover:rotate-12 transition-transform">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-lg font-black tracking-tighter uppercase font-outfit">DrawToCreate</span>
                    </div>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] text-center">
                        © 2026 Creativity Labs. Engineered in high-performance.
                    </p>
                </div>
            </footer>
        </div>
    );
};

