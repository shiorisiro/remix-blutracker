import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';

export function AuthModal(props: any) {
  const {
    setIsAuthModalOpen,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authDisplayName, setAuthDisplayName,
    authError, setAuthError,
    authMode, setAuthMode,
    isAuthLoading, setIsAuthLoading,
    handleEmailAuth, loginWithGoogle
  } = props;

  return (
    <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] p-6 w-full max-w-sm shadow-2xl space-y-5 relative transition-colors duration-200"
            >
              <button 
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setAuthEmail('');
                  setAuthPassword('');
                  setAuthDisplayName('');
                  setAuthError(null);
                }} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1 text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {authMode === 'login' ? 'Masuk Akun' : 'Daftar Akun'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {authMode === 'login' ? 'Silakan masuk untuk mencadangkan data Anda' : 'Buat akun gratis Anda sekarang'}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-xl flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <UserIcon size={16} />
                      </div>
                      <input 
                        type="text" 
                        required
                        placeholder="Nama Anda"
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blu-primary/20 dark:focus:ring-purple-500/20 text-sm transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Alamat Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={16} />
                    </div>
                    <input 
                      type="email" 
                      required
                      placeholder="nama@email.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blu-primary/20 dark:focus:ring-purple-500/20 text-sm transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Kata Sandi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blu-primary/20 dark:focus:ring-purple-500/20 text-sm transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3 mt-4 bg-blu-primary dark:bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-blu-primary/20 dark:shadow-purple-500/10 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="animate-spin text-white" size={16} />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>{authMode === 'login' ? 'Masuk' : 'Daftar Akun Baru'}</span>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-550 my-2">
                <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-850"></div>
                <span className="font-bold uppercase tracking-wider">ATAU MASUK DENGAN</span>
                <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-850"></div>
              </div>

              <button 
                type="button"
                onClick={async () => {
                  try {
                    setIsAuthLoading(true);
                    await loginWithGoogle();
                    setIsAuthModalOpen(false);
                  } catch (e) {
                    // Handled inside loginWithGoogle
                  } finally {
                    setIsAuthLoading(false);
                  }
                }}
                className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-750 text-gray-750 dark:text-gray-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {/* SVG for Google G Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google Sign-In</span>
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError(null);
                  }}
                  className="text-xs text-blu-primary dark:text-purple-400 hover:underline font-semibold"
                >
                  {authMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
                </button>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                <p className="text-[10px] text-gray-400 dark:text-gray-550 leading-normal text-center">
                  <b>Catatan:</b> Jika Anda menggunakan aplikasi APK dan Google Sign-In tidak bekerja, silakan gunakan <b>Email & Kata Sandi</b> untuk masuk.
                </p>
              </div>

            </motion.div>
          </motion.div>
       
  );
}
