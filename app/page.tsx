'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Plus, File, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjectsList } from '@/lib/firebase-hooks';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

import { LandingPage } from '@/components/LandingPage';
import { LogOut } from 'lucide-react';

import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { projects, isLoading } = useProjectsList();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    const storedUser = sessionStorage.getItem('figma-clone-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleCreateNew = () => {
    const roomId = uuidv4();
    router.push(`/design/${roomId}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('figma-clone-user');
    window.location.reload();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = confirm('💣 EMERGENCY DELETE: Are you sure you want to permanently erase this masterpiece? It will be removed from Your Legacy Folder and cannot be recovered.');

    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'projects', id));
        // Note: Real-time sync via useProjectsList will handle UI update
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete the project. Please check your connection.");
      }
    }
  };

  if (!isClient) return null;

  // Show stunning landing page if not "logged in"
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-white rotate-45" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase italic">Baba Builder</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Premium Member</p>
            <p className="text-[11px] font-bold text-gray-400 capitalize">{user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all flex items-center gap-2"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-bold sm:inline hidden">Exit</span>
          </button>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 border-2 border-white flex items-center justify-center text-white font-black">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">

        {/* Hero / Create Action */}
        <section className="mb-20 bg-[#0f172a] rounded-[2.5rem] p-12 border border-blue-500/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white tracking-tighter leading-[1.1]">
              Launch your next <br /> <span className="text-blue-500">masterpiece.</span>
            </h2>
            <p className="text-gray-400 mb-10 max-w-md text-lg font-medium leading-relaxed">Your cloud-synced workstation is ready. Every stroke, every layer is preserved for eternity.</p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-4 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 text-xl group"
            >
              <Plus className="w-7 h-7 stroke-[4px]" />
              Start Fresh Design
            </button>
          </div>
        </section>

        {/* Recent Files */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Legacy Folder</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Cloud Synced & Protected</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-72 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-gray-50 rounded-[3rem] p-24 text-center border-2 border-dashed border-gray-200">
              <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 border border-gray-100">
                <Plus className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Your creation vault is empty</h3>
              <p className="text-gray-500 mb-10 max-w-sm mx-auto text-lg font-medium">Begin your journey by creating your first masterpiece. It will automatically materialize here.</p>
              <button
                onClick={handleCreateNew}
                className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-600 transition-all text-lg shadow-xl"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8 }}
                  onClick={() => router.push(`/design/${project.id}`)}
                  className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden cursor-pointer group hover:border-blue-500/30 transition-all relative shadow-sm hover:shadow-2xl hover:shadow-blue-500/10"
                >
                  {/* Thumbnail */}
                  <div className="h-52 bg-gray-50 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-50/30 transition-colors">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 z-10 group-hover:bg-blue-600 group-hover:border-blue-400">
                          <File className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-7">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-black text-xl text-gray-900 group-hover:text-blue-600 transition-colors truncate pr-4 tracking-tight">
                        {project.name || 'Untitled Masterpiece'}
                      </h3>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-2 bg-white/80 backdrop-blur-sm border border-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-xl transition-all shadow-sm"
                        title="Delete Design Permanently"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </span>
                      <span className="font-bold text-gray-300">Edited {new Date(project.lastOpened).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
