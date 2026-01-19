'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Plus, File, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjectsList } from '@/lib/firebase-hooks';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function Dashboard() {
  const router = useRouter();
  const { projects, isLoading } = useProjectsList();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCreateNew = () => {
    const roomId = uuidv4();
    // Redirecting will trigger auto-save in Canvas which creates the project doc
    router.push(`/design/${roomId}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this design?')) {
      await deleteDoc(doc(db, 'projects', id));
      // Note: We might also want to delete the actual design data in 'rooms/{id}'
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BABABUILDER" className="h-[50px] w-[50px] object-contain" />
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Baba Builder</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Cloud Storage</p>
            <p className="text-[10px] text-gray-400">Syncing active</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md border-2 border-white"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">

        {/* Hero / Create Action */}
        <section className="mb-12 bg-white rounded-3xl p-10 border border-gray-100 shadow-sm flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 text-gray-900 tracking-tight">Create your next <span className="text-blue-600">masterpiece</span></h2>
            <p className="text-gray-500 mb-8 max-w-md">Your designs are automatically saved to our secure cloud folder. Pick up exactly where you left off from any device.</p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-lg"
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
              New Design
            </button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-50/50 -skew-x-12 translate-x-1/2"></div>
        </section>

        {/* Recent Files */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Your Cloud Folder</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your folder is empty</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">Create a design and it will automatically appear here for you to continue later.</p>
              <button
                onClick={handleCreateNew}
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -6 }}
                  onClick={() => router.push(`/design/${project.id}`)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group hover:border-blue-300 transition-all relative"
                >
                  {/* Thumbnail */}
                  <div className="h-44 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-gray-200/40" />
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10">
                      <File className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate pr-4">
                        {project.name || 'Untitled Design'}
                      </h3>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-md transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <span className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-green-500" />
                        Ready to Edit
                      </span>
                      <span className="text-gray-300">{new Date(project.lastOpened).toLocaleDateString()}</span>
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
