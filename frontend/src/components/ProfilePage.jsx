import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, LogOut, Edit2, Check, X, Loader2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';

const ProfilePage = ({ user, onLogout, darkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const creationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Unknown';

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user.displayName || '');
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`p-8 rounded-2xl border backdrop-blur-xl shadow-xl ${
        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                  <User size={64} />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full shadow-lg"></div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`text-2xl font-bold px-3 py-1 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Enter your name"
                  autoFocus
                />
              ) : (
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {user.displayName || 'User Profile'}
                </h1>
              )}
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                  title="Edit Profile"
                >
                  <Edit2 size={18} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
                    title="Save Changes"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  </button>
                  <button 
                    onClick={handleCancel}
                    disabled={isSaving}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} disabled:opacity-50`}
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
            <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {user.email}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20 uppercase tracking-wider">
                {user.providerData[0]?.providerId === 'google.com' ? 'Google Account' : 'Standard Account'}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold border border-purple-500/20 uppercase tracking-wider">
                Active Session
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-bold">Account Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <span className="text-sm font-medium">Email Verified</span>
              </div>
              <span className={`text-xs font-bold ${user.emailVerified ? 'text-green-500' : 'text-amber-500'}`}>
                {user.emailVerified ? 'VERIFIED' : 'PENDING'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm font-medium">Member Since</span>
              </div>
              <span className="text-xs font-bold text-slate-500">{creationDate}</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 text-purple-500 rounded-lg">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold">Personalization</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5">
              <span className="text-sm font-medium">Theme Preference</span>
              <span className="text-xs font-bold uppercase">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5">
              <span className="text-sm font-medium">Language</span>
              <span className="text-xs font-bold uppercase">English (IN)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
