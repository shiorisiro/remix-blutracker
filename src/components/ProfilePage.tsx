import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, LogOut, Moon, Sun, Trash2, ChevronRight, AlertCircle, Check, X, Loader2, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProfilePageProps {
  user: any;
  theme: string;
  toggleTheme: () => void;
  logout: () => void;
  handleRemoveDuplicates: () => void;
  handleClearCurrentMonth: () => void;
  isEditingName: boolean;
  setIsEditingName: (v: boolean) => void;
  tempName: string;
  setTempName: (v: string) => void;
  handleSaveName: () => void;
  isSavingName: boolean;
  appVersion: string;
}

export function ProfilePage({
  user, theme, toggleTheme, logout, handleRemoveDuplicates, handleClearCurrentMonth,
  isEditingName, setIsEditingName, tempName, setTempName, handleSaveName, isSavingName, appVersion
}: ProfilePageProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDupConfirm, setShowDupConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090B]">
      <header className="bg-[#FFFFFF] dark:bg-[#0D0F12] p-6 border-b border-gray-100 dark:border-[#22272F]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Profil</h2>
      </header>

      <div className="p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F] text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#14181E] border-4 border-[#CFFF0F]/20 flex items-center justify-center overflow-hidden">
            <User size={40} className="text-gray-400" />
          </div>
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
                className="bg-gray-50 dark:bg-[#14181E] border border-gray-200 dark:border-[#22272F] rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF0F]/50"
                placeholder="Nama baru..." disabled={isSavingName} autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); else if (e.key === 'Escape') setIsEditingName(false); }} />
              <button onClick={handleSaveName} disabled={isSavingName} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-emerald-500">
                {isSavingName ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              </button>
              <button onClick={() => setIsEditingName(false)} disabled={isSavingName} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div onClick={() => { setTempName(user?.displayName || user?.email?.split('@')[0] || ''); setIsEditingName(true); }}
              className="group flex items-center justify-center gap-1 cursor-pointer mb-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user?.displayName || user?.email?.split('@')[0] || 'Pengguna'}</h3>
              <Edit2 size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CFFF0F]" />
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Mail size={14} /><span>{user?.email || 'Tidak ada email'}</span>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-[#13161A] rounded-[24px] border border-gray-100 dark:border-[#22272F] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#22272F]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 dark:bg-[#14181E] rounded-xl flex items-center justify-center">
                {theme === 'light' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-indigo-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Mode Gelap</p>
                <p className="text-[10px] text-gray-400">{theme === 'dark' ? 'Aktif' : 'Nonaktif'}</p>
              </div>
            </div>
            <button onClick={toggleTheme} className={cn("relative w-12 h-7 rounded-full transition-all duration-300", theme === 'dark' ? "bg-[#CFFF0F]" : "bg-gray-200")}>
              <motion.div animate={{ x: theme === 'dark' ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-100 dark:border-[#22272F]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pengelolaan Data</p>
            <button onClick={() => setShowDupConfirm(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#14181E] rounded-xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center"><Trash2 size={16} className="text-orange-500" /></div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Hapus Duplikat</p>
                  <p className="text-[10px] text-gray-400">Bersihkan data ganda</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
            <button onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#14181E] rounded-xl transition-colors group mt-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center"><AlertCircle size={16} className="text-red-500" /></div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Hapus Bulan Ini</p>
                  <p className="text-[10px] text-gray-400">Hapus semua transaksi bulan ini</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          </div>

          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center"><LogOut size={16} className="text-red-500" /></div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Keluar</p>
            </div>
            <ChevronRight size={16} className="text-red-300 group-hover:text-red-500 transition-colors" />
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-600">Blu Tracker v{appVersion}</p>
        </div>
      </div>

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><LogOut size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Keluar?</h3>
                <p className="text-sm text-gray-500">Apakah kamu yakin ingin keluar dari akun?</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => { logout(); setShowLogoutConfirm(false); }} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors">Ya, Keluar</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">Batal</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear Month Confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><AlertCircle size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Hapus Bulan Ini?</h3>
                <p className="text-sm text-gray-500">Semua transaksi bulan ini akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => { handleClearCurrentMonth(); setShowClearConfirm(false); }} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors">Ya, Hapus Semua</button>
              <button onClick={() => setShowClearConfirm(false)} className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">Batal</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Remove Duplicates Confirm */}
      {showDupConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"><Trash2 size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Hapus Duplikat?</h3>
                <p className="text-sm text-gray-500">Transaksi dengan judul, jumlah, dan tanggal yang sama akan dihapus. Hanya satu yang tersisa.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => { handleRemoveDuplicates(); setShowDupConfirm(false); }} className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-colors">Ya, Bersihkan</button>
              <button onClick={() => setShowDupConfirm(false)} className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">Batal</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
