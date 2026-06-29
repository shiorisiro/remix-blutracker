import React, { useRef } from 'react';
import {
  Edit2, Check, X, Loader2, Bot, CloudOff, RefreshCw,
  User as UserIcon, Trash2, ImagePlus, Sun, Moon, Smile, Star,
  Heart, Coffee, Rocket, Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppUser } from '../auth';
import { SettingsRow } from './ui/SettingsRow';
import { Card } from './ui/Card';
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
  setIsAvatarPickerOpen: (v: boolean) => void;
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
  user,
  theme,
  toggleTheme,
  syncStatus,
  syncPendingCount,
  onFlushQueue,
  selectedAvatar,
  isAvatarPickerOpen,
  setIsAvatarPickerOpen,
  isSavingAvatar,
  isUploadingPhoto,
  handleSelectAvatar,
  handlePhotoUpload,
  avatarFileInputRef,
  isEditingName,
  setIsEditingName,
  tempName,
  setTempName,
  isSavingName,
  handleSaveName,
  onOpenAiSettings,
  onRemoveDuplicates,
  onClearCurrentMonth,
  onLogout,
  onLoginClick,
}: ProfileScreenProps) {
  const hasPhoto = isPhotoUrl(selectedAvatar);
  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
  const ActiveAvatarIcon = activeAvatar.icon;

  return (
    <section className="space-y-4">
      {/* 1. Identity Card */}
      <Card className="p-6 flex flex-col items-center text-center space-y-3">
        {user ? (
          <>
            {/* Avatar */}
            <button
              onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
              disabled={isUploadingPhoto}
              className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#14181E] ring-4 ring-gray-50 dark:ring-[#0D0F12] shadow-lg overflow-hidden text-gray-600 dark:text-[#CFFF0F] cursor-pointer hover:opacity-90 transition-all"
            >
              {isUploadingPhoto ? (
                <Loader2 size={28} className="animate-spin" />
              ) : hasPhoto ? (
                <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ActiveAvatarIcon size={40} />
              )}
              <div className="absolute bottom-0 inset-x-0 py-1.5 bg-black/40 flex items-center justify-center">
                <Edit2 size={10} className="text-white" />
              </div>
            </button>

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
                <button onClick={handleSaveName} disabled={isSavingName} className="p-1 text-emerald-500 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded transition-colors">
                  {isSavingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => setIsEditingName(false)} disabled={isSavingName} className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempName(user.displayName || user.email?.split('@')[0] || '');
                  setIsEditingName(true);
                }}
                className="flex items-center gap-1.5 font-bold text-lg text-gray-900 dark:text-white hover:opacity-80 transition-all"
              >
                {user.displayName || user.email?.split('@')[0] || 'Pengguna'}
                <Edit2 size={12} className="text-gray-400" />
              </button>
            )}
            <p className="text-xs text-gray-400">{user.email}</p>

            {/* Avatar picker */}
            <input ref={avatarFileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <AnimatePresence>
              {isAvatarPickerOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full overflow-hidden">
                  <div className="w-full pt-4 border-t border-gray-100 dark:border-[#22272F] space-y-3">
                    <button
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="w-full py-3 bg-gray-50 dark:bg-[#08090B] border border-dashed border-gray-200 dark:border-[#22272F] rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-[#CFFF0F]/50 transition-all"
                    >
                      {isUploadingPhoto ? <Loader2 size={16} className="animate-spin text-[#CFFF0F]" /> : <ImagePlus size={16} className="text-[#CFFF0F]" />}
                      {isUploadingPhoto ? 'Mengunggah...' : 'Upload Foto Sendiri'}
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
                              'aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50',
                              isActive
                                ? 'bg-[#CFFF0F]/15 ring-2 ring-[#CFFF0F] text-gray-950 dark:text-[#CFFF0F]'
                                : 'bg-gray-50 dark:bg-[#0D0F12] text-gray-400 hover:bg-gray-100 dark:hover:bg-[#14181E]'
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
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 bg-gray-50 dark:bg-[#14181E] rounded-full flex items-center justify-center">
              <UserIcon size={28} className="text-gray-300" />
            </div>
            <p className="font-bold text-sm text-gray-500 dark:text-gray-400">Belum Login</p>
            <p className="text-xs text-gray-400 text-center">Login untuk sinkronisasi data ke cloud</p>
            <button onClick={onLoginClick} className="px-5 py-2.5 bg-[#CFFF0F] text-black text-xs font-bold rounded-xl hover:bg-[#CFFF0F]/90 transition-colors cursor-pointer">
              Login Sekarang
            </button>
          </div>
        )}
      </Card>

      {/* 2. Preferences */}
      <Card className="p-5 space-y-3">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Preferensi</p>
        <SettingsRow
          icon={theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          title="Tema"
          helper={theme === 'light' ? 'Mode Terang aktif' : 'Mode Gelap aktif'}
          onClick={toggleTheme}
          trailing={
            <button
              onClick={toggleTheme}
              className={cn(
                'relative w-[52px] h-[28px] rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center shadow-inner',
                theme === 'light' ? 'bg-sky-200' : 'bg-slate-950 border border-slate-800'
              )}
            >
              <motion.div
                animate={{ x: theme === 'light' ? 2 : 26 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn('absolute w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10', theme === 'light' ? 'bg-amber-400' : 'bg-slate-700')}
              >
                {theme === 'light' ? <Sun size={12} className="fill-white text-white" /> : <Moon size={12} className="fill-yellow-200 text-yellow-200" />}
              </motion.div>
            </button>
          }
        />
        <SettingsRow
          icon={<Bot size={16} />}
          title="Pengaturan AI"
          helper="Gemini API Key untuk scan struk & analisis"
          onClick={onOpenAiSettings}
        />
      </Card>

      {/* 3. Sync & Storage */}
      {user && (
        <Card className="p-5 space-y-3">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sinkronisasi</p>
          <SettingsRow
            icon={
              syncStatus === 'offline' ? <CloudOff size={16} /> :
              syncStatus === 'syncing' ? <RefreshCw size={16} className="animate-spin" /> :
              syncStatus === 'pending' ? <RefreshCw size={16} /> :
              <Check size={16} />
            }
            title={
              syncStatus === 'offline' ? 'Offline' :
              syncStatus === 'syncing' ? 'Menyinkronkan...' :
              syncStatus === 'pending' ? `${syncPendingCount} transaksi belum tersinkron` :
              'Tersinkron'
            }
            helper={syncStatus === 'pending' ? 'Ketuk untuk coba sinkronisasi ulang' : undefined}
            onClick={syncStatus === 'pending' ? onFlushQueue : undefined}
          />
        </Card>
      )}

      {/* 4. Data Management */}
      <Card className="p-5 space-y-3">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pengelolaan Data</p>
        {user ? (
          <SettingsRow
            icon={<Trash2 size={16} />}
            title="Hapus Transaksi Duplikat"
            onClick={onRemoveDuplicates}
            destructive
          />
        ) : (
          <p className="text-xs text-gray-400 text-center py-2">Login diperlukan untuk hapus data duplikat di cloud</p>
        )}
        <SettingsRow
          icon={<Trash2 size={16} />}
          title="Hapus Semua Transaksi Bulan Ini"
          onClick={onClearCurrentMonth}
          destructive
        />
      </Card>

      {/* 5. Logout */}
      {user && (
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all cursor-pointer active:scale-95 text-red-500 dark:text-red-400"
        >
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          Keluar
        </button>
      )}
    </section>
  );
}
