import { useState, useEffect, useRef } from 'react';
import { 
    User, Save, ShieldCheck, Store, HelpCircle, Mail, 
    Lock, Phone, FileText, ExternalLink, MessageSquare, 
    Edit3, Eye, EyeOff, ChevronRight, ChevronLeft, ChevronDown, Sparkles, 
    Package, ShoppingBag, TrendingUp, CreditCard, 
    Filter, Zap, Lightbulb, X, Palette, Star, Send, Loader2,
    Target, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getLogoUrl } from '../../utils/logo';
import {
  updateProfile,
  updatePassword,
  updateStore,
  updateGoal,
  getGoalSuggestions,
  exportData,
} from '../../services/api';

interface ModalProps {
    onClose: () => void;
}

// --- 0. THEME DEFINITIONS ---
const themes = [
    { 
        id: 'classic', name: 'Classic Grain', 
       primary: '#fa9d6a', secondary: '#8B5E3C', accent: '#F5F5DC',
        card: '#ffffff', system: '#F9FAFB', border: '#E5E7EB', text: '#111827',
        overlay: 'rgba(249, 250, 251, 0.4)'
    },
    { 
        id: 'forest', name: 'Forest', 
       primary: '#A8BBA3', secondary: '#4A5D45', accent: '#f1f5f0',
        card: '#ffffff', system: '#f7f9f7', border: '#e2e8e1', text: '#2d3a2a',
        overlay: 'rgba(247, 249, 247, 0.6)'
    },
    { 
        id: 'ocean', name: 'Ocean', 
       primary: '#7ba7bd', secondary: '#455a64', accent: '#f0f4f7',
        card: '#ffffff', system: '#f4f7f9', border: '#dae1e7', text: '#263238',
        overlay: 'rgba(244, 247, 249, 0.6)'
    },
    { 
        id: 'silk', name: 'Silk Harvest', 
        primary: '#C2A378', secondary: '#5C5448', accent: '#FAF9F6',
        card: '#ffffff', system: '#F5F5F0', border: '#E8E6E1', text: '#4A463F',
        overlay: 'rgba(255, 255, 255, 0.75)'
    },
    {
        id: 'peach', name: 'Peach',
        primary: '#DC9B9B', secondary: '#7D4F4F', accent: '#fff5f5',
        card: '#ffffff', system: '#fffafa', border: '#f7e4e4', text: '#4a3232',
        overlay: 'rgba(255, 250, 250, 0.7)'
    },
];

const applyThemeToDocument = (themeId: string) => {
    const t = themes.find(theme => theme.id === themeId) || themes[0];
    const root = document.documentElement;
    root.style.setProperty('--primary-main', t.primary);
    root.style.setProperty('--secondary-main', t.secondary);
    root.style.setProperty('--bg-accent', t.accent);
    root.style.setProperty('--bg-card', t.card);
    root.style.setProperty('--bg-system', t.system);
    root.style.setProperty('--border-color', t.border);
    root.style.setProperty('--text-main', t.text);
    root.style.setProperty('--bg-overlay', t.overlay); 
};

// --- 1. PROFILE DETAILS ---
export const ProfileModal = ({ onClose }: ModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
    }, []);

    const handleSave = async () => {
        try {
            const { ok, data } = await updateProfile({ name, email, phone });
            if (ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success("Profile Updated!");
                setIsEditing(false);
                onClose();
            } else {
                toast.error("Failed to update profile.");
            }
        } catch {
            toast.error("Something went wrong.");
        }
    };

    return (
        <div className="space-y-3 text-center max-h-[75vh] flex flex-col relative transition-colors duration-500">
            <div className="flex justify-end shrink-0">
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-[var(--bg-system)] rounded-full transition-colors text-[var(--secondary-main)] opacity-40 active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>

            {!isEditing ? (
                // Display Mode - Centered Card Style
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary-main)] to-[var(--secondary-main)] flex items-center justify-center shadow-lg">
                        <User size={40} className="text-white" />
                    </div>

                    {/* Name */}
                    <h2 className="text-2xl font-black text-[var(--text-main)] italic">{name || 'User'}</h2>

                    {/* Email */}
                    <p className="text-xs text-[var(--secondary-main)] opacity-60">{email || 'No email'}</p>

                    {/* Role/Location */}
                    <p className="text-xs text-[var(--secondary-main)] opacity-50 flex items-center justify-center gap-1">
                        <span>Store Owner</span>
                        <span>•</span>
                        <span>{phone || 'No phone'}</span>
                    </p>

                    {/* Edit Button */}
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="mt-4 flex items-center justify-center gap-2 bg-[var(--primary-main)] text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[var(--primary-main)]/30 hover:shadow-lg hover:shadow-[var(--primary-main)]/40"
                    >
                        <Edit3 size={16} /> Edit Profile
                    </button>
                </div>
            ) : (
                // Edit Mode
                <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar pb-2 transition-all">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-black text-[var(--text-main)] italic">Edit Profile</h2>
                    </div>

                    <div className="p-2.5 rounded-xl flex items-center gap-2 border-2 bg-[var(--bg-card)] border-[var(--primary-main)] shadow-sm">
                        <User size={16} className="text-[var(--secondary-main)] opacity-40 shrink-0" />
                        <input className="bg-transparent outline-none w-full font-bold text-sm text-[var(--text-main)]" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
                    </div>

                    <div className="p-2.5 rounded-xl flex items-center gap-2 border-2 bg-[var(--bg-card)] border-[var(--primary-main)] shadow-sm">
                        <Mail size={16} className="text-[var(--secondary-main)] opacity-40 shrink-0" />
                        <input className="bg-transparent outline-none w-full font-bold text-sm text-[var(--text-main)]" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" />
                    </div>

                    <div className="p-2.5 rounded-xl flex items-center gap-2 border-2 bg-[var(--bg-card)] border-[var(--primary-main)] shadow-sm">
                        <Phone size={16} className="text-[var(--secondary-main)] opacity-40 shrink-0" />
                        <input className="bg-transparent outline-none w-full font-bold text-sm text-[var(--text-main)]" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" />
                    </div>

                    <div className="flex gap-2 pt-2 shrink-0 animate-in fade-in slide-in-from-top-1">
                        <button onClick={() => setIsEditing(false)} className="flex-1 p-2.5 rounded-lg font-black text-xs text-[var(--secondary-main)] opacity-60 bg-[var(--bg-system)] uppercase tracking-widest transition-all">Cancel</button>
                        <button onClick={handleSave} className="flex-1 bg-[var(--primary-main)] text-white p-2.5 rounded-lg font-black uppercase text-xs tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-[var(--primary-main)]/20 transition-all">
                            <Save size={14} /> Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 2. SECURITY & PASSWORD ---
export const SecurityModal = ({ onClose }: ModalProps) => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const isStrongPassword = (pass: string) => {
        const strongRegex = /^(?=.*[0-9]|.*[!@#$%^&*])(?=.{8,})/;
        return strongRegex.test(pass);
    };

    const handleUpdatePassword = async () => {
        if (passwords.new === passwords.current) {
            return toast.error("New password cannot be the same as current.");
        }
        if (!isStrongPassword(passwords.new)) {
            return toast.error("Password must be 8+ chars with a number or symbol.");
        }
        if (passwords.new !== passwords.confirm) {
            return toast.error("New passwords do not match.");
        }

        setLoading(true);
        try {
            const { ok, data } = await updatePassword(passwords.current, passwords.new);
            if (ok) {
                toast.success("Password updated successfully!");
                onClose();
            } else {
                toast.error((data as { message?: string }).message || "Failed to update password.");
            }
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 text-center max-h-[75vh] flex flex-col relative transition-colors duration-500">
            <div className="flex justify-end shrink-0">
                <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-system)] rounded-full text-[var(--secondary-main)] opacity-40 active:scale-90"><X size={18} /></button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-main)] to-[var(--secondary-main)] flex items-center justify-center shadow-lg">
                    <ShieldCheck size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-main)] italic">Security</h2>
                <p className="text-xs text-[var(--secondary-main)] opacity-60">Change your password</p>
            </div>

            <div className="overflow-y-auto pr-1 custom-scrollbar pb-2 space-y-2.5">
                <div className="bg-[var(--bg-card)] p-3 rounded-lg flex items-center gap-2 border border-[var(--border-color)] focus-within:border-[var(--primary-main)] transition-all">
                    <Lock size={16} className="text-[var(--secondary-main)] opacity-40" />
                    <input
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="Current Password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="bg-transparent outline-none w-full font-bold text-sm text-[var(--text-main)] flex-1"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-[var(--secondary-main)] opacity-40">
                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>

                <div className="bg-[var(--bg-card)] p-3 rounded-lg flex items-center gap-2 border border-[var(--border-color)] focus-within:border-[var(--primary-main)] transition-all">
                    <Lock size={16} className="text-[var(--secondary-main)] opacity-40" />
                    <input
                        type={showNew ? 'text' : 'password'}
                        placeholder="New Password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="bg-transparent outline-none w-full font-bold text-sm text-[var(--text-main)] flex-1"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="text-[var(--secondary-main)] opacity-40">
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>

                <div className="bg-[var(--bg-card)] p-3 rounded-lg flex items-center gap-2 border border-[var(--border-color)] focus-within:border-[var(--primary-main)] transition-all">
                    <ShieldCheck size={16} className="text-[var(--secondary-main)] opacity-40" />
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="bg-transparent outline-none w-full font-bold text-sm text-[var(--text-main)] flex-1"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-[var(--secondary-main)] opacity-40">
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>

                <button
                    onClick={handleUpdatePassword}
                    disabled={loading}
                    className="w-full bg-[var(--primary-main)] text-white p-3 rounded-lg font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-lg shadow-[var(--primary-main)]/20 flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : 'Update Password'}
                </button>
            </div>
        </div>
    );
};

// --- 3. STORE SETTINGS ---
export const StoreSettingsModal = ({ onClose }: ModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [logo, setLogo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setStoreName(user.store_name || '');
        setAddress(user.store_address || '');
        setLogo(user.logo_path || null);
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogo(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogo(null);
        toast.success("Logo removed from preview. Save to confirm.");
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { ok, data } = await updateStore({
                store_name: storeName,
                store_address: address,
                logo_path: logo || undefined,
            });

            if (ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success("Store details updated!");
                setIsEditing(false);
                onClose();
            } else {
                toast.error("Failed to save changes.");
            }
        } catch (error) {
            toast.error("Connection error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 text-center max-h-[75vh] flex flex-col relative transition-colors duration-500">
            <div className="flex justify-end shrink-0">
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-[var(--bg-system)] rounded-full transition-colors text-[var(--secondary-main)] opacity-40 active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>

            {!isEditing ? (
                // Display Mode - Centered Card Style
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    {/* Logo */}
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--primary-main)] to-[var(--secondary-main)] flex items-center justify-center shadow-lg overflow-hidden">
                        {logo ? (
                            <img 
                                src={getLogoUrl(logo) || logo || ''} 
                                alt="Logo" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Store size={40} className="text-white" />
                        )}
                    </div>

                    {/* Store Name */}
                    <h2 className="text-2xl font-black text-[var(--text-main)] italic">{storeName || 'Store Name'}</h2>

                    {/* Address */}
                    <p className="text-xs text-[var(--secondary-main)] opacity-60">{address || 'No address'}</p>

                    {/* Edit Button */}
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="mt-4 flex items-center justify-center gap-2 bg-[var(--primary-main)] text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[var(--primary-main)]/30 hover:shadow-lg hover:shadow-[var(--primary-main)]/40"
                    >
                        <Edit3 size={16} /> Edit Store
                    </button>
                </div>
            ) : (
                // Edit Mode
                <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar pb-2 transition-all">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-black text-[var(--text-main)] italic">Edit Store</h2>
                    </div>

                    {/* Logo Upload Area */}
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-system)] transition-colors">
                        {logo ? (
                            <img 
                                src={getLogoUrl(logo) || logo || ''} 
                                alt="Logo" 
                                className="w-16 h-16 rounded-lg object-cover mb-2 shadow-md border border-[var(--bg-card)]"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-[var(--bg-card)] rounded-lg flex items-center justify-center text-[var(--secondary-main)] opacity-20 mb-2"><Store size={28} /></div>
                        )}
                        
                        <div className="flex gap-1.5">
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="text-[8px] font-black uppercase text-[var(--primary-main)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg shadow-sm border border-[var(--border-color)] active:scale-95 transition-all"
                            >
                                {logo ? "Change" : "Upload"}
                            </button>
                            {logo && (
                                <button 
                                    onClick={handleRemoveLogo} 
                                    className="text-[8px] font-black uppercase text-red-600 bg-[var(--bg-card)] px-3 py-1.5 rounded-lg shadow-sm border border-red-100 active:scale-95 transition-all"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>

                    {/* Input Fields */}
                    <input className="w-full p-2.5 rounded-lg outline-none font-bold text-sm bg-[var(--bg-card)] border-2 border-[var(--primary-main)] transition-all" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Store Name" />
                    <input className="w-full p-2.5 rounded-lg outline-none font-bold text-sm bg-[var(--bg-card)] border-2 border-[var(--primary-main)] transition-all" value={address} onChange={e => setAddress(e.target.value)} placeholder="Store Address" />

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0 pt-1">
                        <button onClick={() => setIsEditing(false)} className="flex-1 p-2.5 rounded-lg font-black text-xs text-[var(--secondary-main)] opacity-60 bg-[var(--bg-system)] uppercase tracking-widest transition-all">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="flex-1 bg-[var(--primary-main)] text-white p-2.5 rounded-lg font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-lg shadow-[var(--primary-main)]/20 disabled:opacity-75">
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 4. HELP CENTER ---
export const HelpCenterModal = ({ onClose }: ModalProps) => {
    const [view, setView] = useState<'menu' | 'guide' | 'feedback'>('menu');
    const [openStep, setOpenStep] = useState<number | null>(0);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const guideSteps = [
        { 
            title: "Inventory Mastery", 
            icon: <Package size={16} />,
            desc: "The Inventory tab is your command center. Add varieties, set current stock (kg), and prices. Tip: Use the 'Archived' view to restore varieties you previously stopped selling without re-entering their data." 
        },
        { 
            title: "POS Efficiency", 
            icon: <ShoppingBag size={16} />,
            desc: "On the POS screen, use the search bar to instantly filter rice types. When a customer buys multiple bags, you can process them in one transaction." 
        },
        { 
            title: "Smart Debt Recovery", 
            icon: <CreditCard size={16} />,
            desc: "The 'Unpaid' filter in Utang Reports identifies which sukis owe the most. Use the 'Settle' function to mark a debt as paid." 
        },
        { 
            title: "Store Analytics", 
            icon: <TrendingUp size={16} />,
            desc: "Analytics shows your peak hours and demand breakdown so you know which rice varieties drive the most revenue." 
        }
    ];

    const quickTips = [
        { icon: <Zap size={12} />, text: "Use 'Online' payment for G-Cash to keep your cash drawer accurate." },
        { icon: <Filter size={12} />, text: "Filter Suki by 'Spent' to identify your VIP high-value customers." },
    ];

    const handleSubmitFeedback = async () => {
        if (rating === 0) return toast.error("Please select a rating.");
        setIsSubmitting(true);
        try {
            toast.success("Thanks for your feedback!");
            setRating(0);
            setComment('');
            setView('menu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackupExport = async () => {
        try {
            const { ok, data } = await exportData();
            if (!ok) return toast.error('Backup failed.');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `grainflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Backup downloaded!');
        } catch {
            toast.error('Backup failed.');
        }
    };

    return (
        <div className="space-y-3 text-center max-h-[75vh] flex flex-col relative transition-colors duration-500 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
                {view !== 'menu' && (
                    <button 
                        onClick={() => setView('menu')} 
                        className="text-[9px] font-black uppercase text-[var(--primary-main)] bg-[var(--bg-card)] px-2 py-1 rounded-lg border border-[var(--primary-main)]/20 hover:bg-[var(--bg-system)] transition-colors"
                    >
                        Back
                    </button>
                )}
                <div className="flex-1" />
                <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-system)] rounded-full text-[var(--secondary-main)] opacity-40 active:scale-90"><X size={18} /></button>
            </div>

            <div className="flex flex-col items-center justify-center py-2 space-y-2">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-main)] to-[var(--secondary-main)] flex items-center justify-center shadow-lg">
                    <HelpCircle size={32} className="text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-[var(--text-main)] italic">Help Center</h2>
                <p className="text-xs text-[var(--secondary-main)] opacity-60">Master GrainFlow platform</p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                {view === 'menu' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2 pb-4">
                            <div 
                                onClick={() => setView('guide')}
                                className="group p-3 bg-[var(--text-main)] border border-[var(--text-main)] rounded-xl shadow-lg hover:shadow-[var(--primary-main)]/20 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-1.5 relative z-10">
                                    <div className="p-1.5 bg-white/10 rounded-lg text-[var(--bg-accent)] group-hover:scale-110 transition-transform"><FileText size={16}/></div>
                                    <div className="flex items-center gap-1 bg-[var(--primary-main)] text-white px-1.5 py-0.5 rounded-md transition-colors">
                                        <Sparkles size={8} />
                                        <span className="text-[7px] font-black uppercase">Guide</span>
                                    </div>
                                </div>
                                <h4 className="font-black text-[var(--bg-card)] text-sm tracking-tight relative z-10 transition-colors">Master Operations</h4>
                                <p className="text-[9px] text-[var(--bg-card)] opacity-60 mt-0.5 relative z-10 leading-tight transition-colors">Deep dive into POS, Inventory, Debt & Analytics.</p>
                                <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase text-[var(--bg-card)] relative z-10 transition-colors">
                                    <span>Read</span>
                                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                                <HelpCircle className="absolute -right-4 -bottom-4 text-white/5 w-20 h-20 transition-opacity" />
                            </div>

                            <div 
                                onClick={() => setView('feedback')}
                                className="group p-3 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl shadow-sm hover:border-[var(--primary-main)] transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="p-1.5 bg-[var(--bg-card)] rounded-lg text-[var(--primary-main)] border border-[var(--border-color)] shadow-sm transition-colors group-hover:scale-110 transition-transform"><MessageSquare size={16}/></div>
                                    <div className="flex items-center gap-1">
                                        <Star size={10} className="text-amber-500 fill-amber-500" />
                                        <span className="text-[8px] font-black uppercase text-amber-600">Rate</span>
                                    </div>
                                </div>
                                <h4 className="font-black text-[var(--text-main)] text-sm tracking-tight transition-colors">User Feedback</h4>
                                <p className="text-[9px] text-[var(--secondary-main)] opacity-60 mt-0.5 transition-colors">Share your thoughts with our team.</p>
                                <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase text-[var(--primary-main)] transition-colors">
                                    <span>Share</span>
                                    <ChevronRight size={12} />
                                </div>
                            </div>

                            <div
                                onClick={handleBackupExport}
                                className="group p-3 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl shadow-sm hover:border-[var(--primary-main)] transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="p-1.5 bg-[var(--bg-card)] rounded-lg text-[var(--primary-main)] border border-[var(--border-color)] shadow-sm group-hover:scale-110 transition-transform"><Save size={16}/></div>
                                    <span className="text-[8px] font-black uppercase text-[var(--primary-main)]">Backup</span>
                                </div>
                                <h4 className="font-black text-[var(--text-main)] text-sm tracking-tight">Export Store Data</h4>
                                <p className="text-[9px] text-[var(--secondary-main)] opacity-60 mt-0.5">Download a JSON backup of products and sales.</p>
                            </div>

                            <div className="group p-3 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl shadow-sm hover:border-[var(--primary-main)] transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="p-1.5 bg-[var(--bg-card)] rounded-lg text-[var(--primary-main)] border border-[var(--border-color)] shadow-sm transition-colors group-hover:scale-110 transition-transform"><Mail size={16}/></div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[8px] font-black uppercase text-emerald-600">Support</span>
                                    </div>
                                </div>
                                <h4 className="font-black text-[var(--text-main)] text-sm tracking-tight transition-colors">Technical Support</h4>
                                <p className="text-[9px] text-[var(--secondary-main)] opacity-60 mt-0.5 transition-colors">Found a bug? Contact us.</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 text-[9px] font-bold text-[var(--text-main)] bg-[var(--bg-card)] p-2 rounded-lg flex items-center gap-1.5 border border-[var(--border-color)] shadow-inner overflow-hidden truncate transition-all">
                                        <Mail size={12} className="text-[var(--primary-main)] shrink-0 transition-colors" /> grainflow1012@gmail.com
                                    </div>
                                    <a 
                                        href="mailto:grainflow1012@gmail.com"
                                        className="p-2 bg-[var(--primary-main)] text-white rounded-lg hover:opacity-90 transition-all shadow-md"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>

                            <div className="p-3 bg-[var(--bg-system)] rounded-xl border border-[var(--border-color)] transition-colors">
                                 <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest mb-2 flex items-center gap-1.5 transition-colors"><Lightbulb size={10}/> Pro Tips</p>
                                 <div className="grid grid-cols-1 gap-1.5">
                                    {quickTips.map((tip, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[8px] font-medium text-[var(--text-main)] transition-colors">
                                            <span className="text-[var(--primary-main)] transition-colors">{tip.icon}</span>
                                            <span className="opacity-80">{tip.text}</span>
                                        </div>
                                    ))}
                                 </div>
                            </div>
                        </div>
                    </div>
                ) : view === 'guide' ? (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300 pb-4">
                        <div className="space-y-1.5">
                            {guideSteps.map((step, i) => (
                                <div key={i} className="rounded-lg border border-[var(--border-color)] overflow-hidden shadow-sm transition-all">
                                    <button 
                                        onClick={() => setOpenStep(openStep === i ? null : i)}
                                        className={`w-full flex items-center justify-between p-2.5 text-left transition-all ${openStep === i ? 'bg-[var(--primary-main)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-system)]'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1 rounded-lg transition-colors ${openStep === i ? 'bg-white/20' : 'bg-[var(--bg-system)] text-[var(--primary-main)]'}`}>
                                                {step.icon}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wide transition-colors">{step.title}</span>
                                        </div>
                                        {openStep === i ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </button>
                                    
                                    {openStep === i && (
                                        <div className="p-2.5 bg-[var(--bg-card)] text-[var(--secondary-main)] opacity-80 text-[9px] font-medium leading-relaxed border-t border-[var(--border-color)] animate-in slide-in-from-top-1 transition-all">
                                            {step.desc}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 text-center px-2">
                        <div className="shrink-0 flex flex-col items-center gap-1.5 mb-3">
                            <div className="p-2 bg-[var(--bg-accent)] rounded-full text-[var(--primary-main)]">
                                <Sparkles size={20} />
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-main)] italic leading-tight transition-colors">Help Us Refine!</h2>
                            <p className="text-[9px] text-[var(--secondary-main)] opacity-60 font-bold uppercase tracking-widest transition-colors">How is GrainFlow working?</p>
                        </div>

                        <div className="flex-1 min-h-0 bg-[var(--bg-system)] p-3 rounded-xl border border-[var(--border-color)] mb-3 flex flex-col">
                            <div className="shrink-0 flex justify-center gap-1.5 mb-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        className="transition-transform active:scale-90"
                                    >
                                        <Star 
                                            size={24} 
                                            className={`transition-colors ${
                                                star <= (hover || rating) 
                                                ? 'fill-amber-400 text-amber-400' 
                                                : 'text-[var(--secondary-main)] opacity-20'
                                            }`} 
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Any features or issues?"
                                className="flex-1 w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2.5 text-[9px] font-bold text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] transition-all resize-none shadow-inner custom-scrollbar"
                            />
                        </div>

                        <button 
                            onClick={handleSubmitFeedback}
                            disabled={isSubmitting}
                            className="shrink-0 w-full bg-[var(--primary-main)] text-white p-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg shadow-[var(--primary-main)]/20 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-2 border-black/10 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" size={14} /> Sending...</>
                            ) : (
                                <><Send size={14} /> Submit</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 5. SYSTEM PREFERENCES ---
export const PreferencesModal = ({ onClose }: ModalProps) => {
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('system-theme') || 'classic');
    const [mascotVisible, setMascotVisible] = useState(() => {
        const saved = localStorage.getItem('mascot-visible');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [mascotMovement, setMascotMovement] = useState(() => {
        const saved = localStorage.getItem('mascot-movement');
        return saved || 'static-bottom-right';
    });

    useEffect(() => {
        applyThemeToDocument(currentTheme);
    }, [currentTheme]);

    const handleApplyTheme = (themeId: string) => {
        setCurrentTheme(themeId);
        localStorage.setItem('system-theme', themeId);
        applyThemeToDocument(themeId);
        toast.success(`${themes.find(t => t.id === themeId)?.name} applied!`);
    };

    const handleMascotToggle = () => {
        const newValue = !mascotVisible;
        setMascotVisible(newValue);
        localStorage.setItem('mascot-visible', JSON.stringify(newValue));
        toast.success(newValue ? 'GrainBot is now visible!' : 'GrainBot is now hidden!');
        // Dispatch custom event for real-time update
        window.dispatchEvent(new CustomEvent('mascot-settings-changed', { detail: { visible: newValue } }));
    };

    const handleMascotMovement = (movement: string) => {
        setMascotMovement(movement);
        localStorage.setItem('mascot-movement', movement);
        toast.success('GrainBot movement updated!');
        // Dispatch custom event for real-time update
        window.dispatchEvent(new CustomEvent('mascot-settings-changed', { detail: { movement } }));
    };

    return (
        <div className="space-y-2 text-left max-h-[75vh] flex flex-col relative transition-colors duration-500">
            <div className="flex justify-between items-center shrink-0">
                <div className="p-2 bg-[var(--bg-accent)] rounded-xl text-[var(--primary-main)] shadow-sm transition-colors">
                    <Palette size={20} />
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-full text-[var(--secondary-main)] opacity-40 active:scale-90 transition-all transition-colors">
                    <X size={18} />
                </button>
            </div>
            <h2 className="text-lg font-black text-[var(--text-main)] italic transition-colors leading-tight">System Preferences</h2>
            <div className="space-y-2 overflow-y-auto pr-1 pb-2 custom-scrollbar transition-all">
                {/* Theme Selection */}
                <div className="space-y-1.5">
                    <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-60 uppercase tracking-wider">Theme</p>
                    <div className="grid grid-cols-5 gap-1.5">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleApplyTheme(t.id)}
                                className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                                    currentTheme === t.id ? 'border-[var(--primary-main)] shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                                }`}
                            >
                                <div className="flex gap-1 transition-all">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: t.primary }} />
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: t.accent }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mascot Toggle */}
                <div className="mt-3 pt-2 border-t border-[var(--border-color)]">
                    <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-60 uppercase tracking-wider mb-1.5">Assistant</p>
                    <button
                        onClick={handleMascotToggle}
                        className="w-full p-2.5 rounded-xl border-2 border-transparent bg-[var(--bg-system)] hover:border-[var(--primary-main)] hover:bg-[var(--bg-card)] flex items-center justify-between transition-all duration-300 mb-2"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[var(--bg-accent)] rounded-lg text-[var(--primary-main)]">
                                <Sparkles size={14} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-[var(--text-main)] text-xs uppercase leading-tight">GrainBot Assistant</p>
                                <p className="text-[7px] text-[var(--secondary-main)] opacity-60 mt-0.5">Your helpful companion</p>
                            </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-all duration-300 flex items-center ${
                            mascotVisible ? 'bg-[var(--primary-main)]' : 'bg-[var(--secondary-main)] opacity-30'
                        }`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                mascotVisible ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                        </div>
                    </button>

                    {/* Mascot Movement Options - Visual Screen Mockup */}
                    <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-60 uppercase tracking-wider mb-1.5">Position</p>
                    <div className="bg-[var(--bg-system)] border-2 border-[var(--border-color)] rounded-lg p-3 flex items-center justify-center">
                        <div className="relative w-full aspect-square max-w-[120px] bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] flex items-center justify-center">
                            {/* Screen mockup with 4 corner dots */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Top Left */}
                                <button
                                    onClick={() => handleMascotMovement('static-top-left')}
                                    className={`absolute top-2 left-2 w-3 h-3 rounded-full transition-all duration-300 ${
                                        mascotMovement === 'static-top-left'
                                            ? 'bg-[var(--primary-main)] scale-125 shadow-lg'
                                            : 'bg-[var(--border-color)] hover:bg-[var(--secondary-main)]'
                                    }`}
                                />
                                {/* Top Right */}
                                <button
                                    onClick={() => handleMascotMovement('static-top-right')}
                                    className={`absolute top-2 right-2 w-3 h-3 rounded-full transition-all duration-300 ${
                                        mascotMovement === 'static-top-right'
                                            ? 'bg-[var(--primary-main)] scale-125 shadow-lg'
                                            : 'bg-[var(--border-color)] hover:bg-[var(--secondary-main)]'
                                    }`}
                                />
                                {/* Bottom Left */}
                                <button
                                    onClick={() => handleMascotMovement('static-bottom-left')}
                                    className={`absolute bottom-2 left-2 w-3 h-3 rounded-full transition-all duration-300 ${
                                        mascotMovement === 'static-bottom-left'
                                            ? 'bg-[var(--primary-main)] scale-125 shadow-lg'
                                            : 'bg-[var(--border-color)] hover:bg-[var(--secondary-main)]'
                                    }`}
                                />
                                {/* Bottom Right */}
                                <button
                                    onClick={() => handleMascotMovement('static-bottom-right')}
                                    className={`absolute bottom-2 right-2 w-3 h-3 rounded-full transition-all duration-300 ${
                                        mascotMovement === 'static-bottom-right'
                                            ? 'bg-[var(--primary-main)] scale-125 shadow-lg'
                                            : 'bg-[var(--border-color)] hover:bg-[var(--secondary-main)]'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 6. MONTHLY SALES GOAL (DATA-DRIVEN) ---
export const GoalModal = ({ onClose }: ModalProps) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true); // Loading state for the suggestions
    const [suggestions, setSuggestions] = useState<{label: string, value: number}[]>([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { ok, data } = await getGoalSuggestions();
                if (ok) {
                    setSuggestions(data.suggestions.map((value: number) => ({ label: `₱${value.toLocaleString()}`, value })));
                    setAmount(String(data.current || ''));
                }
            } catch (error) {
                console.error("Failed to fetch smart goals");
            } finally {
                setFetching(false);
            }
        };

        fetchSuggestions();
    }, []);

    const handleSave = async () => {
        if (!amount || isNaN(Number(amount))) return toast.error("Enter a valid amount.");
        setLoading(true);
        try {
            const { ok, data } = await updateGoal(Number(amount));

            if (ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                const currentTheme = localStorage.getItem('system-theme') || 'classic';
                applyThemeToDocument(currentTheme);
                toast.success("Sales target updated!");
                onClose();
            }
        } catch (error) {
            toast.error("Connection error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 text-center max-h-[75vh] flex flex-col relative transition-colors duration-500">
            <div className="flex justify-end shrink-0">
                <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-system)] rounded-full text-[var(--secondary-main)] opacity-40 active:scale-90"><X size={18} /></button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-3">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-main)] to-[var(--secondary-main)] flex items-center justify-center shadow-lg">
                    <TrendingUp size={32} className="text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-[var(--text-main)] italic">Sales Target</h2>
                <p className="text-xs text-[var(--secondary-main)] opacity-60">Set your monthly revenue goal</p>

                {/* Input Section */}
                <div className="w-full mt-4 space-y-3">
                    <div className="bg-[var(--bg-card)] p-4 rounded-xl border-2 border-[var(--primary-main)] focus-within:shadow-lg transition-all flex items-center gap-2">
                        <button 
                            onClick={() => setAmount(Math.max(0, Number(amount) - 1000).toString())}
                            className="p-1.5 hover:bg-[var(--bg-system)] rounded-lg text-[var(--primary-main)] active:scale-90 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xl font-black text-[var(--primary-main)]">₱</span>
                        <input 
                            type="number" 
                            className="bg-transparent outline-none w-full font-black text-2xl text-[var(--text-main)] placeholder:opacity-20 [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden" 
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <button 
                            onClick={() => setAmount((Number(amount) + 1000).toString())}
                            className="p-1.5 hover:bg-[var(--bg-system)] rounded-lg text-[var(--primary-main)] active:scale-90 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest">Suggestions</p>
                        
                        {fetching ? (
                            <div className="p-4 text-center opacity-20"><Loader2 className="animate-spin mx-auto" size={20} /></div>
                        ) : (
                            <div className="space-y-1.5">
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setAmount(s.value.toString())}
                                        className="w-full flex items-center justify-between p-2.5 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-lg hover:border-[var(--primary-main)] hover:bg-[var(--bg-card)] group transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-[var(--bg-card)] rounded-lg text-[var(--secondary-main)] group-hover:text-[var(--primary-main)] transition-colors">
                                                {s.label === 'Growth' ? <TrendingUp size={12}/> : s.label === 'Stretch' ? <Target size={12}/> : <Award size={12}/>}
                                            </div>
                                            <span className="text-[9px] font-black uppercase text-[var(--text-main)]">{s.label}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-[var(--primary-main)]">₱{s.value.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-[var(--primary-main)] text-white p-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg shadow-[var(--primary-main)]/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={14}/> : "Set Target"}
                    </button>
                </div>
            </div>
        </div>
    );
};