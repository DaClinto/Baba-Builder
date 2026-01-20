'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Layers, Zap, Users, ShieldCheck, Github, Chrome } from 'lucide-react';
import Link from 'next/link';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex items-center justify-between backdrop-blur-md bg-[#020617]/50 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/assets/kanvaso-logo.svg" alt="Kanvaso" className="w-10 h-10 rounded-xl" />
                    <span className="text-xl font-black tracking-tighter uppercase">Kanvaso</span>
                </div>
                <div className="hidden md:flex items-center gap-10 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
                    <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                        Log In
                    </Link>
                    <Link href="/login" className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-500 hover:text-white transition-all">
                        Sign Up
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 px-8 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[60%] bg-violet-600/10 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                            <Zap className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">v2.0 is now live</span>
                        </div>
                        <h1 className="text-7xl md:text-8xl xl:text-9xl font-black leading-[0.9] mb-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent tracking-tighter">
                            Create your next <br /> masterpiece.
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                            The collaborative design tool built for the next generation of creative minds. Real-time, boundless, and purely professional.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 group text-lg"
                            >
                                Start Designing Free
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-2xl font-bold transition-all text-lg">
                                View Examples
                            </button>
                        </div>
                    </motion.div>

                    {/* App Preview */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="relative max-w-6xl mx-auto"
                    >
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] pointer-events-none -z-10" />
                        <div className="rounded-[2.5rem] border border-white/10 bg-[#020617] p-4 shadow-2xl glass overflow-hidden shadow-black/80">
                            <img
                                src="/assets/hero.png"
                                alt="Dashboard Preview"
                                className="rounded-[1.8rem] w-full"
                            />
                        </div>

                        {/* Floating Feature Cards */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="absolute -left-12 top-1/4 hidden xl:block glass p-5 rounded-3xl border border-white/10 shadow-2xl max-w-[200px]"
                        >
                            <Layers className="w-8 h-8 text-blue-500 mb-3" />
                            <h4 className="font-bold mb-1">Layer Stack</h4>
                            <p className="text-[11px] text-gray-400">Professional depth management for complex designs.</p>
                        </motion.div>

                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="absolute -right-12 bottom-1/4 hidden xl:block glass p-5 rounded-3xl border border-white/10 shadow-2xl max-w-[200px]"
                        >
                            <Users className="w-8 h-8 text-violet-500 mb-3" />
                            <h4 className="font-bold mb-1">Collaboration</h4>
                            <p className="text-[11px] text-gray-400">Work together in real-time with multi-cursor support.</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-8 bg-black/40">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Built for speed.</h2>
                        <p className="text-gray-400 max-w-xl mx-auto">Every pixel is optimized for performance and professional workflows.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <Zap className="text-yellow-500" />, title: 'Lightning Fast', desc: 'Optimized canvas engine that handles thousands of objects without lag.' },
                            { icon: <Layers className="text-blue-500" />, title: 'Smart Layers', desc: 'Powerful grouping and layering system for professional architectures.' },
                            { icon: <ShieldCheck className="text-green-500" />, title: 'Secure Cloud', desc: 'Your masterpieces are encrypted and backed up to the cloud automatically.' },
                        ].map((f, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 p-10 rounded-[32px] hover:border-white/10 transition-all hover:bg-white/[0.07] group">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-40 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 pointer-events-none -z-10" />
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-6xl md:text-7xl font-black mb-10 tracking-tighter">Ready to build your <br /> legacy?</h2>
                    <p className="text-xl text-gray-400 mb-12">Join over 10,000 creators who chose Baba Builder for their creative journey.</p>
                    <Link
                        href="/login"
                        className="bg-white text-black px-12 py-6 rounded-2xl font-black text-xl hover:bg-blue-500 hover:text-white transition-all inline-flex items-center gap-3 shadow-2xl shadow-white/5 group"
                    >
                        Get Started Now
                        <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 border-t border-white/5 text-center">
                <div className="flex items-center gap-3 justify-center mb-10">
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase">Baba Builder</span>
                </div>
                <p className="text-gray-600 text-sm font-medium uppercase tracking-[0.3em]">© 2026 Creativity Labs. All rights reserved.</p>
            </footer>
        </div>
    );
};
