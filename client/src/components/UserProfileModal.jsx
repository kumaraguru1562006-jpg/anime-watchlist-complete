import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  Edit3, 
  Check, 
  Sparkles, 
  Bookmark, 
  CheckCircle2, 
  Clock, 
  Flame,
  Camera,
  Layers,
  Search,
  CheckCircle,
  Tv,
  Film
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import famousAvatarsData from '../data/animeAvatars.json';

export const UserProfileModal = () => {
  const { user, stats, watchlistMap, updateUserProfile, logout, isProfileModalOpen, closeProfileModal } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  
  // Crunchyroll-style character picker states
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState('All');
  const [avatarSearch, setAvatarSearch] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditAvatar(user.avatar || '');
      setEditBio(user.bio || 'Anime enthusiast exploring Japanese animation.');
    }
  }, [user]);

  // Extract unique anime franchise categories for Crunchyroll-style filter tabs
  const categories = useMemo(() => {
    const set = new Set();
    famousAvatarsData.forEach((a) => {
      if (a.anime) set.add(a.anime);
    });
    return ['All', ...Array.from(set).slice(0, 8)];
  }, []);

  // Filtered famous anime character avatars
  const filteredAvatars = useMemo(() => {
    let list = famousAvatarsData;
    if (avatarFilter !== 'All') {
      list = list.filter((a) => a.anime === avatarFilter);
    }
    if (avatarSearch.trim()) {
      const q = avatarSearch.toLowerCase().trim();
      list = list.filter((a) => 
        a.name.toLowerCase().includes(q) || (a.anime && a.anime.toLowerCase().includes(q))
      );
    }
    return list;
  }, [avatarFilter, avatarSearch]);

  if (!isProfileModalOpen || !user) return null;

  const memberSince = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Oct 2026';

  // Calculate estimated hours watched (average 24 mins per episode)
  const totalEpisodes = Object.values(watchlistMap || {}).reduce((acc, curr) => {
    if (curr.status === 'completed') {
      const eps = Number(curr.totalEpisodes) || 12;
      return acc + eps;
    }
    return acc;
  }, 0);
  const estimatedHours = Math.round((totalEpisodes * 24) / 60);

  // 1-Click Select & Save Avatar (Crunchyroll Style)
  const handleSelectCharacter = async (char) => {
    setEditAvatar(char.image);
    setSaving(true);
    try {
      await updateUserProfile({
        name: editName.trim() || user.name,
        avatar: char.image,
        bio: editBio.trim() || user.bio,
      });
      setSaveSuccess(`Profile picture updated to ${char.name}!`);
      setShowAvatarPicker(false);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      alert(`Failed to set avatar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name: editName.trim() || user.name,
        avatar: editAvatar.trim() || user.avatar,
        bio: editBio.trim() || user.bio,
      });
      setIsEditing(false);
      setShowAvatarPicker(false);
      setSaveSuccess('Profile successfully updated!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    closeProfileModal();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={closeProfileModal}
    >
      <div 
        className="relative w-full max-w-2xl liquid-glass-nav bg-[#0c1022]/95 rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/20 overflow-hidden space-y-5 my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient liquid lighting glow */}
        <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Top Header & Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <User className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                User Profile & Anime Identity
              </h2>
              <p className="text-[11px] text-slate-400">Manage your Crunchyroll-style character avatar and watchlist stats</p>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto space-y-5 pr-1 flex-1">
          
          {/* PROFILE CARD */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative group">
            {/* Avatar with Direct Click to Choose Character Picture */}
            <div 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative flex-shrink-0 cursor-pointer group select-none"
              title="Click to choose a famous anime character for your profile"
            >
              <img
                src={editAvatar || user.avatar || 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png'}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-xl group-hover:scale-105 group-hover:ring-cyan-400 transition-all"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 mb-1 text-cyan-300" />
                <span>Change Image</span>
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-purple-600 text-white shadow-md border-2 border-[#0c1022]">
                <Camera className="w-3 h-3 text-cyan-300" />
              </span>
            </div>

            {/* User Meta Information */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-white truncate">
                  {user.name}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  Firebase Verified
                </span>
              </div>

              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.email}</span>
              </p>

              <p className="text-xs text-slate-300 italic pt-0.5 leading-relaxed">
                "{user.bio || 'Anime enthusiast exploring Japanese animation.'}"
              </p>

              <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  Member since {memberSince}
                </span>
                <span>•</span>
                <span className="text-cyan-300 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Auto-login Active
                </span>
              </div>
            </div>

            {/* Quick Edit Bio Button */}
            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Bio'}</span>
              </button>
            </div>
          </div>

          {/* CRUNCHYROLL-STYLE CHARACTER PICKER: ONLY SHOWN WHEN PROFILE PICTURE IS CLICKED */}
          {showAvatarPicker && (
            <div className="p-4 rounded-2xl bg-black/50 border border-purple-500/40 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-heading">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Choose Anime Character Avatar</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Click any famous character to immediately set as your profile avatar
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Character Search Bar */}
                  <div className="relative flex-1 sm:w-44">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search character..."
                      value={avatarSearch}
                      onChange={(e) => setAvatarSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-[11px] placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(false)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white text-xs transition-colors"
                    title="Close avatar picker"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* Franchise Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAvatarFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    avatarFilter === cat
                      ? 'bg-purple-600 text-white shadow-sm font-semibold'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Character Cards Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredAvatars.map((char) => {
                const isSelected = (editAvatar === char.image) || (user.avatar === char.image);
                return (
                  <div
                    key={char.name}
                    onClick={() => handleSelectCharacter(char)}
                    className={`cursor-pointer group relative rounded-xl p-1.5 border transition-all text-center flex flex-col items-center ${
                      isSelected
                        ? 'bg-purple-600/20 border-cyan-400 ring-2 ring-cyan-400/50 scale-[1.02]'
                        : 'bg-white/[0.03] border-white/10 hover:border-purple-400/50 hover:bg-white/[0.08]'
                    }`}
                    title={`Set ${char.name} (${char.anime}) as your avatar`}
                  >
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden mb-1.5 shadow-md">
                      <img
                        src={char.image}
                        alt={char.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[1px] flex items-center justify-center">
                          <Check className="w-5 h-5 text-cyan-300 font-bold" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-white truncate w-full group-hover:text-cyan-300 transition-colors">
                      {char.name}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate w-full font-mono">
                      {char.anime}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* EDIT FORM (OPTIONAL FIELDS: NAME & BIO) */}
          {isEditing && (
            <form onSubmit={handleSaveAll} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">Edit Name & Bio</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Custom Avatar Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (or choose character above)"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Bio / Status
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* WATCHLIST STATS TILES */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Your Anime Watchlist Statistics</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">To Watch</p>
                <p className="text-lg font-bold font-mono text-purple-300">{stats.planToWatchCount || 0}</p>
                <span className="text-[9px] text-slate-500 font-mono">Planned</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">Watched</p>
                <p className="text-lg font-bold font-mono text-emerald-300">{stats.completedCount || 0}</p>
                <span className="text-[9px] text-slate-500 font-mono">Completed</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">Episodes</p>
                <p className="text-lg font-bold font-mono text-cyan-300">{totalEpisodes}</p>
                <span className="text-[9px] text-slate-500 font-mono">Tracked</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">Hours</p>
                <p className="text-lg font-bold font-mono text-amber-300">{estimatedHours}h</p>
                <span className="text-[9px] text-slate-500 font-mono">Time Spent</span>
              </div>
            </div>
          </div>

          {/* DEDICATED PROMINENT LOGOUT SECTION INSIDE USER PROFILE */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Account Session & Security</h4>
                <p className="text-[11px] text-slate-400">
                  Signed in as <strong className="text-slate-200">{user.email}</strong>. Watchlists are safe in the cloud.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 border border-rose-400/30 transition-all flex items-center justify-center gap-2 group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Log Out of Account</span>
            </button>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-Persistence Enabled • No repeated logins required</span>
          </div>

          <button
            onClick={closeProfileModal}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
