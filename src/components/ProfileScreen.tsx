import React from 'react';
import {
  Edit2, Check, X, Loader2, Bot, CloudOff, RefreshCw,
  User as UserIcon, Trash2, ImagePlus, Sun, Moon, Smile, Star,
  Heart, Coffee, Rocket, Flame, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppUser } from '../auth';
import { cn } from '../lib/utils';

const AVATAR_OPTIONS = [
  { id: 'avatar-1', icon: Smile },
  { id: 'avatar-2', icon: Star },
  { id: 'avatar-3', icon: Heart },
  { id: 'avatar-4', icon: Coffee },
  { id: 'avatar-5', icon: Rocket },
  { id: 'avatar-6', icon: Flame },
] as const;

const isPhotoUrl = (val?: string | null) => !!val && (val.startsWith('http://') || val.startsWith('https://'));

interface ProfileScreenProps {
  user: AppUser | null;
  theme: string;
  toggleTheme: () => void;
  syncStatus: 'offline' | 'syncing' | 'pending' | 'synced';
  syncPendingCount: number;
  onFlushQueue: () => void;
  selectedAvatar: string;
  isAvatarPickerOpen: boolean;
  setIsAvatarPickerOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  isSavingAvatar: boolean;
  isUploadingPhoto: boolean;
  handleSelectAvatar: (id: string) => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarFileInputRef: React.RefObject<HTMLInputElement>;
  isEditingName: boolean;
  setIsEditingName: (v: boolean) => void;
  tempName: string;
  setTempName: (v: string) => void;
  isSavingName: boolean;
  handleSaveName: () => void;
  onOpenAiSettings: () => void;
  onRemoveDuplicates: () => void;
  onClearCurrentMonth: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
}

export function ProfileScreen({
  user, theme, toggleTheme,
  syncStatus, syncPendingCount, onFlushQueue,
  selectedAvatar, isAvatarPickerOpen, setIsAvatarPickerOpen,
  isSavingAvatar, isUploadingPhoto,
  handleSelectAvatar, handlePhotoUpload, avatarFileInputRef,
  isEditingName, setIsEditingName, tempName, setTempName,
  isSavingName, handleSaveName,
  onOpenAiSettings, onRemoveDuplicates, onClearCurrentMonth,
  onLogout, onLoginClick,
}: ProfileScreenProps) {
  const hasPhoto = isPhotoUrl(selectedAvatar);
  const activeAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
  const ActiveAvatarIcon = activeAvatar.icon;

  return (
    <section className="space-y-6">
      {/* Identity Card - original single-card layout */}
      {user ? (
        <div className="relative bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F] flex flex-col items-center text-center space-y-3 transition-colors duration-200">
          {/* Top-right: AI + sync + theme toggle */}
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button
              onClick={onOpenAiSettings}
              className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 rounded-xl transition-all flex items-center justify-center text-gray-700 dark:text-gray-300 cursor-pointer"
              title="Pengaturan AI"
            >
              <span className="filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_3px_10px_rgba(255,255,255,0.35)] transform hover:scale-110 active:scale-95 transition-all inline-block">
                <Bot size={18} />
              </span>
            </button>

            <button
              onClick={onFlushQueue}
              disabled={syncStatus === 'offline' || syncStatus === 'syncing'}
              title={
                syncStatus === 'offline' ? 'Offline - tersimpan di perangkat' :
                syncStatus === 'syncing' ? 'Menyinkronkan...' :
                syncStatus === 'pending' ? `${syncPendingCount} transaksi belum tersinkron - tap untuk coba lagi` :
                'Tersinkron'
              }
              className={cn(
                "relative w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default",
                syncStatus === 'offline' && "bg-gray-50 dark:bg-[#14181E] text-gray-400",
                syncStatus === 'syncing' && "bg-sky-50 dark:bg-sky-950/30 text-sky-500",
                syncStatus === 'pending' && "bg-amber-50 dark:bg-amber-950/30 text-amber-500",
                syncStatus === 'synced' && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500",
              )}
            >
              {syncStatus === 'offline' && <CloudOff size={15} />}
              {syncStatus === 'syncing' && <RefreshCw size={15} className="animate-spin" />}
              {syncStatus === 'pending' && <RefreshCw size={15} />}
              {syncStatus === 'synced' && <Check size={15} />}
              {syncStatus === 'pending' && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">
                  {syncPendingCount}
                </span>
              )}
            </button>

            {/* Theme toggle - pointer-events-none on motion children fixes Android tap issue */}
            <button
              onClick={toggleTheme}
              className={cn(
                "relative w-[52px] h-[28px] rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center shadow-inner",
                theme === 'light' ? "bg-sky-200" : "bg-slate-950 border border-slate-800"
              )}
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            >
              <div className="absolute inset-0 pointer-events-none">
                {theme === 'light' ? (
                  <div className="absolute right-2 top-[7px] w-4 h-2 bg-white/90 rounded-full">
                    <div className="absolute -top-1 left-1 w-3 h-3 bg-white/90 rounded-full" />
                  </div>
                ) : (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-[3px] items-center opacity-70">
                    <span className="text-white text-[6px] leading-none">✦</span>
                    <span className="text-yellow-100 text-[4px] leading-none">✦</span>
                    <span className="text-white text-[5px] leading-none">✦</span>
                  </div>
                )}
              </div>
              <motion.div
                animate={{ x: theme === 'light' ? 2 : 26 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn(
                  "absolute w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10 pointer-events-none",
                  theme === 'light' ? "bg-amber-400" : "bg-slate-700"
                )}
              >
                <motion.div
                  animate={{ rotate: theme === 'light' ? 0 : 360 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="pointer-events-none"
                >
                  {theme === 'light'
                    ? <Sun size={13} className="fill-white text-white" />
                    : <Moon size={13} className="fill-yellow-200 text-yellow-200" />
                  }
                </motion.div>
              </motion.div>
            </button>
          </div>

          {/* Avatar */}
          <div className="pt-6">
            <button
              onClick={() => setIsAvatarPickerOpen(v => !v)}
              disabled={isUploadingPhoto}
              className="relative w-32 h-32 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#14181E] ring-4 ring-gray-50 dark:ring-[#0D0F12] shadow-lg overflow-hidden text-gray-600 dark:text-[#CFFF0F] cursor-pointer hover:opacity-90 transition-all"
              title="Pilih avatar"
            >
              {isUploadingPhoto ? (
                <Loader2 size={32} className="animate-spin" />
              ) : hasPhoto ? (
                <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ActiveAvatarIcon size={48} />
              )}
              <div className="absolute bottom-0 inset-x-0 py-1.5 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Edit2 size={11} className="text-white" />
              </div>
            </button>
          </div>

          {/* Name */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-gray-50 dark:bg-[#14181E] border border-gray-200 dark:border-[#22272F] rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 dark:text-white focus:outline-none text-center"
                placeholder="Nama baru..."
                disabled={isSavingName}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  else if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button onClick={handleSaveName} disabled={isSavingName} className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-emerald-500 transition-colors cursor-pointer">
                {isSavingName ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
              </button>
              <button onClick={() => setIsEditingName(false)} disabled={isSavingName} className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                const defaultName = user.displayName || user.email?.split('@')[0] || '';
                setTempName(defaultName);
                setIsEditingName(true);
              }}
              className="relative inline-flex items-center justify-center cursor-pointer hover:opacity-85 transition-all"
            >
              <span className="font-bold text-lg tracking-tight text-gray-950 dark:text-white">
                {user.displayName || user.email?.split('@')[0] || 'Pengguna'}
              </span>
              <Edit2 size={12} className="absolute -right-4 text-gray-300 dark:text-gray-600" />
            </div>
          )}

          <p className="text-xs text-gray-400">{user.email}</p>

          {/* Avatar Picker */}
          <input ref={avatarFileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <AnimatePresence>
            {isAvatarPickerOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full overflow-hidden"
              >
                <div className="w-full pt-4 border-t border-gray-100 dark:border-[#22272F] space-y-3">
                  <button
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full py-3 bg-[#F8FAFC] dark:bg-[#08090B] border border-dashed border-gray-200 dark:border-[#22272F] rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-[#CFFF0F]/50 transition-all disabled:opacity-60"
                  >
                    {isUploadingPhoto ? <Loader2 size={16} className="animate-spin text-[#CFFF0F]" /> : <ImagePlus size={16} className="text-[#CFFF0F]" />}
                    <span>{isUploadingPhoto ? 'Mengunggah...' : 'Upload Foto Sendiri'}</span>
                  </button>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((avatar) => {
                      const AvatarIcon = avatar.icon;
                      const isActive = selectedAvatar === avatar.id;
                      return (
                        <button
                          key={avatar.id}
                          onClick={async () => {
                            await handleSelectAvatar(avatar.id);
                            setIsAvatarPickerOpen(false);
                          }}
                          disabled={isSavingAvatar || isUploadingPhoto}
                          className={cn(
                            "aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50",
                            isActive
                              ? "bg-[#CFFF0F]/15 ring-2 ring-[#CFFF0F] text-gray-950 dark:text-[#CFFF0F]"
                              : "bg-gray-50 dark:bg-[#0D0F12] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#14181E]"
                          )}
                        >
                          <AvatarIcon size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#13161A] p-8 rounded-[32px] border border-dashed border-gray-200 dark:border-[#22272F] flex flex-col items-center text-center gap-3 transition-colors duration-200">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#14181E] rounded-full flex items-center justify-center">
            <UserIcon size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">Belum Login</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Login untuk mengatur profil, avatar, dan sinkronisasi data ke cloud.</p>
          <button
            onClick={onLoginClick}
            className="mt-2 px-5 py-2.5 bg-[#CFFF0F] text-black text-xs font-bold rounded-xl hover:bg-[#CFFF0F]/90 transition-colors cursor-pointer"
          >
            Login Sekarang
          </button>
        </div>
      )}

      {/* Data management */}
      <div className="bg-white dark:bg-[#13161A] p-5 rounded-[32px] border border-gray-100 dark:border-[#22272F] space-y-3 transition-colors duration-200">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pengelolaan & Reset Data</p>
        <div className="flex flex-col gap-2">
          {user ? (
            <button
              onClick={onRemoveDuplicates}
              className="w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-red-50/50 dark:hover:bg-red-950/25 border border-red-100 dark:border-red-950/80 rounded-xl flex items-center justify-between text-xs font-bold text-rose-500 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Trash2 size={14} />
                <span>Hapus Transaksi Ganda (Duplikat)</span>
              </div>
              <ChevronRight size={14} />
            </button>
          ) : (
            <div className="p-3 bg-gray-100/50 dark:bg-gray-800/40 rounded-xl text-[10px] text-gray-400 dark:text-gray-500 text-center">
              Fitur Hapus Data Duplikat di Cloud hanya tersedia untuk pengguna yang masuk (Login).
            </div>
          )}
          <button
            onClick={onClearCurrentMonth}
            className="w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-red-50/50 dark:hover:bg-red-950/25 border border-red-100 dark:border-red-950/80 rounded-xl flex items-center justify-between text-xs font-bold text-rose-500 dark:text-rose-400 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Trash2 size={14} />
              <span>Hapus Semua Transaksi Bulan Ini</span>
            </div>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Logout */}
      {user && (
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all cursor-pointer active:scale-95 text-red-500 dark:text-red-400"
        >
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_2px_4px_rgba(239,68,68,0.7)]" />
          <span>Keluar</span>
        </button>
      )}
    </section>
  );
}
