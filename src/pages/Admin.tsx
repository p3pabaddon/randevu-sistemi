import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    LogOut,
    Plus,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Phone,
    Trash2,
    MessageSquare,
    Briefcase,
    History,
    Save,
    MapPin,
    AlertCircle,
    Check,
    ChevronRight,
    Search,
    UserPlus,
    Tag,
    Scissors,
    ShieldCheck,
    Smartphone
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Tab = "today" | "all" | "new" | "settings" | "services" | "crm" | "deleted";

const Admin = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>("today");
    const [loading, setLoading] = useState(false);
    const [tenant, setTenant] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Data States
    const [appointments, setAppointments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0
    });

    // Form States
    const [newAppt, setNewAppt] = useState({
        customer_name: '',
        customer_phone: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        service_id: '',
        staff_id: '',
        notes: ''
    });

    useEffect(() => {
        const savedTenant = sessionStorage.getItem('randevu_tenant');
        if (!savedTenant) {
            navigate("/login");
            return;
        }
        const parsedTenant = JSON.parse(savedTenant);
        setTenant(parsedTenant);
        fetchData(parsedTenant.id);
    }, [navigate]);

    const fetchData = async (tenantId: string) => {
        setLoading(true);
        try {
            // Fetch Appointments
            const { data: appts } = await supabase
                .from('appointments')
                .select('*, services(*), staff(*)')
                .eq('tenant_id', tenantId)
                .order('appointment_date', { ascending: false });

            if (appts) {
                setAppointments(appts);
                const today = new Date().toISOString().split('T')[0];
                const todayAppts = appts.filter(a => a.appointment_date === today);
                setStats({
                    total: todayAppts.length,
                    confirmed: todayAppts.filter(a => a.status === 'confirmed').length,
                    pending: todayAppts.filter(a => a.status === 'pending').length,
                    cancelled: todayAppts.filter(a => a.status === 'cancelled').length
                });
            }

            // Fetch Services
            const { data: svcs } = await supabase
                .from('services')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name');
            if (svcs) setServices(svcs);

            // Fetch Staff
            const { data: staffList } = await supabase
                .from('staff')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name');
            if (staffList) setStaff(staffList);

        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Veriler yüklenirken hata oluştu.");
        }
        setLoading(false);
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppt.customer_name || !newAppt.customer_phone || !newAppt.appointment_date || !newAppt.appointment_time) {
            toast.error("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('appointments')
            .insert([{
                ...newAppt,
                tenant_id: tenant.id,
                status: 'pending'
            }]);

        if (error) {
            toast.error("Randevu oluşturulamadı: " + error.message);
        } else {
            toast.success("Randevu başarıyla oluşturuldu.");
            setNewAppt({
                customer_name: '',
                customer_phone: '',
                appointment_date: new Date().toISOString().split('T')[0],
                appointment_time: '',
                service_id: '',
                staff_id: '',
                notes: ''
            });
            setActiveTab("today");
            fetchData(tenant.id);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('randevu_tenant');
        navigate("/");
        toast.success("Çıkış yapıldı.");
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id);

        if (error) toast.error("Güncellenemedi.");
        else {
            toast.success("Durum güncellendi.");
            fetchData(tenant.id);
        }
    };

    const deleteAppointment = async (id: string) => {
        if (!confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) toast.error("Silinemedi.");
        else {
            toast.success("Randevu silindi.");
            fetchData(tenant.id);
        }
    }

    const filteredAppointments = useMemo(() => {
        return appointments.filter(a =>
            a.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.customer_phone?.includes(searchTerm)
        );
    }, [appointments, searchTerm]);

    const crmData = useMemo(() => {
        const customers = new Map();
        appointments.forEach(a => {
            if (!customers.has(a.customer_phone)) {
                customers.set(a.customer_phone, {
                    name: a.customer_name,
                    phone: a.customer_phone,
                    lastVisit: a.appointment_date,
                    totalBookings: 0,
                    status: 'Active'
                });
            }
            const c = customers.get(a.customer_phone);
            c.totalBookings += 1;
            if (new Date(a.appointment_date) > new Date(c.lastVisit)) {
                c.lastVisit = a.appointment_date;
            }
        });
        return Array.from(customers.values());
    }, [appointments]);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-20 lg:w-72 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen overflow-y-auto">
                <div className="p-8 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Calendar className="text-white" size={20} />
                    </div>
                    <span className="hidden lg:block font-black text-xl tracking-tighter uppercase whitespace-nowrap">RANDEVU <span className="text-primary italic">DUNYASI</span></span>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    {[
                        { id: "today", label: "Bugünün Akışı", icon: LayoutDashboard },
                        { id: "all", label: "Tüm Randevular", icon: Calendar },
                        { id: "new", label: "Yeni Randevu", icon: Plus },
                        { id: "crm", label: "Müşteriler", icon: Users },
                        { id: "services", label: "Hizmetler", icon: Briefcase },
                        { id: "deleted", label: "Çöp Kutusu", icon: History },
                        { id: "settings", label: "Ayarlar", icon: Settings },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as Tab)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === item.id ? "bg-white/5 text-primary" : "text-zinc-500 hover:text-white"}`}
                        >
                            {activeTab === item.id && (
                                <motion.div layoutId="nav-glow" className="absolute inset-0 bg-primary/5 rounded-2xl -z-10" />
                            )}
                            <item.icon size={20} className={activeTab === item.id ? "text-primary" : ""} />
                            <span className="hidden lg:block font-bold text-sm tracking-wide uppercase">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 shrink-0">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-zinc-500 hover:text-red-500 transition-colors group">
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Oturumu Kapat</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-16 overflow-y-auto h-screen relative scroll-smooth selection:bg-primary/30">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">
                            <span className="text-primary/60">PROFESYONEL YÖNETİM</span>
                            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                            <span>{new Date().toLocaleDateString('tr-TR')}</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
                            {activeTab === 'today' && <>GÜNLÜK <span className="text-primary not-italic text-5xl">AKIŞ</span></>}
                            {activeTab === 'services' && <>Hizmet <span className="text-primary not-italic text-5xl">MİMARİSİ</span></>}
                            {activeTab === 'crm' && <>Müşteri <span className="text-primary not-italic text-5xl">YÖNETİMİ</span></>}
                            {!['today', 'services', 'crm'].includes(activeTab) && activeTab.toUpperCase()}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {(activeTab === 'all' || activeTab === 'crm') && (
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="İsim veya telefon ile ara..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-primary transition-all text-sm w-64 lg:w-80"
                                />
                            </div>
                        )}
                        <button onClick={() => fetchData(tenant.id)} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-all text-primary group active:scale-95">
                            <RefreshCw size={24} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                        </button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'today' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="today">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                                {[
                                    { label: "Bugün Toplam", val: stats.total, color: "zinc", icon: LayoutDashboard },
                                    { label: "Onaylı", val: stats.confirmed, color: "emerald", icon: CheckCircle },
                                    { label: "Bekleyen", val: stats.pending, color: "amber", icon: Clock },
                                    { label: "İptal", val: stats.cancelled, color: "red", icon: XCircle },
                                ].map((s) => (
                                    <div key={s.label} className={`bg-${s.color}-500/5 p-8 rounded-[3rem] border border-${s.color}-500/10 backdrop-blur-sm group hover:scale-[1.02] transition-all`}>
                                        <div className={`text-${s.color}-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex justify-between items-start`}>
                                            {s.label}
                                            <s.icon size={16} />
                                        </div>
                                        <div className={`text-6xl font-black text-${s.color}-500 tracking-tighter`}>{s.val}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-zinc-800" /> Bugüne Planlanan Randevular
                                </h2>
                                {appointments
                                    .filter(a => a.appointment_date === new Date().toISOString().split('T')[0])
                                    .map((appt) => (
                                        <AppointmentCard key={appt.id} appt={appt} updateStatus={updateStatus} deleteAppointment={deleteAppointment} />
                                    ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'all' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="all" className="space-y-4">
                            {filteredAppointments.map((appt) => (
                                <AppointmentCard key={appt.id} appt={appt} updateStatus={updateStatus} deleteAppointment={deleteAppointment} />
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'crm' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="crm" className="space-y-4">
                            <div className="bg-zinc-900/10 backdrop-blur-md border border-white/5 rounded-[3rem] overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                            <th className="p-8">Müşteri</th>
                                            <th className="p-8">Telefon</th>
                                            <th className="p-8 text-center">Toplam Randevu</th>
                                            <th className="p-8">Son Ziyaret</th>
                                            <th className="p-8">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {crmData.map((c: any) => (
                                            <tr key={c.phone} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold">{c.name[0]}</div>
                                                        <span className="font-bold text-lg">{c.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8 font-medium text-zinc-400">{c.phone}</td>
                                                <td className="p-8 text-center font-black text-2xl text-primary">{c.totalBookings}</td>
                                                <td className="p-8 font-bold text-zinc-300 uppercase italic text-sm">{c.lastVisit}</td>
                                                <td className="p-8">
                                                    <button className="px-6 py-3 bg-zinc-800 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2">
                                                        MESAJ AT <MessageSquare size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'services' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="services" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <button onClick={() => toast.info("Yeni hizmet ekleme yakında!")} className="aspect-video bg-zinc-900/20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 group hover:border-primary/50 transition-all">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Plus size={32} /></div>
                                <span className="font-black text-xs uppercase tracking-widest text-zinc-500 group-hover:text-primary transition-colors">Yeni Hizmet Oluştur</span>
                            </button>
                            {services.map(s => (
                                <div key={s.id} className="bg-zinc-900/30 backdrop-blur-md border border-white/5 p-8 rounded-[3rem] group hover:border-primary/30 transition-all relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                                            <Scissors size={24} />
                                        </div>
                                        <span className="text-2xl font-black italic text-primary">{s.price} ₺</span>
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase mb-2 group-hover:text-primary transition-colors">{s.name}</h3>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                                        <span className="flex items-center gap-2"><Clock size={12} /> {s.duration_minutes} Dakika</span>
                                        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                        <span className="text-primary italic">Aktif Hizmet</span>
                                    </div>
                                    <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                        <button className="flex-1 py-3 bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">DÜZENLE</button>
                                        <button className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">SİL</button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'new' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key="new" className="max-w-4xl mx-auto">
                            <form onSubmit={handleCreateAppointment} className="bg-zinc-900/30 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 flex items-center gap-2"><UserPlus size={12} className="text-primary" /> Müşteri Adı Soyadı</label>
                                        <input
                                            type="text"
                                            required
                                            value={newAppt.customer_name}
                                            onChange={e => setNewAppt({ ...newAppt, customer_name: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg focus:bg-black/60 shadow-inner"
                                            placeholder="Ad Soyad"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 flex items-center gap-2"><Smartphone size={12} className="text-primary" /> Telefon Numarası</label>
                                        <input
                                            type="tel"
                                            required
                                            value={newAppt.customer_phone}
                                            onChange={e => setNewAppt({ ...newAppt, customer_phone: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg focus:bg-black/60 shadow-inner"
                                            placeholder="5XX XXX XX XX"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 flex items-center gap-2"><Calendar size={12} className="text-primary" /> Tarih</label>
                                        <input
                                            type="date"
                                            required
                                            value={newAppt.appointment_date}
                                            onChange={e => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg focus:bg-black/60 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 flex items-center gap-2"><Clock size={12} className="text-primary" /> Saat</label>
                                        <input
                                            type="time"
                                            required
                                            value={newAppt.appointment_time}
                                            onChange={e => setNewAppt({ ...newAppt, appointment_time: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg focus:bg-black/60 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 flex items-center gap-2"><Tag size={12} className="text-primary" /> Hizmet Seçimi</label>
                                        <select
                                            value={newAppt.service_id}
                                            onChange={e => setNewAppt({ ...newAppt, service_id: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg appearance-none focus:bg-black/60 shadow-inner"
                                        >
                                            <option value="">Hizmet Seçiniz</option>
                                            {services.map(s => <option key={s.id} value={s.id}>{s.name} - {s.price}₺</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 flex items-center gap-2"><ShieldCheck size={12} className="text-primary" /> Personel</label>
                                        <select
                                            value={newAppt.staff_id}
                                            onChange={e => setNewAppt({ ...newAppt, staff_id: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg appearance-none focus:bg-black/60 shadow-inner"
                                        >
                                            <option value="">Personel Seçiniz (Opsiyonel)</option>
                                            {staff.map(s => <option key={s.id} value={s.id}>{s.name} {s.surname}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 flex items-center gap-2"><MessageSquare size={12} className="text-primary" /> Notlar / Özel İstekler</label>
                                    <textarea
                                        value={newAppt.notes}
                                        onChange={e => setNewAppt({ ...newAppt, notes: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-body text-zinc-300 h-32 resize-none focus:bg-black/60 shadow-inner"
                                        placeholder="Eklemek istediğiniz notlar..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-8 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="animate-spin" /> : <Plus size={24} />}
                                    RANDEVUYU SİSTEME İŞLE
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="settings" className="max-w-4xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="bg-zinc-900/30 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 space-y-8">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                        <Settings size={14} /> İŞLETME BİLGİLERİ
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="px-6 py-4 bg-black/40 rounded-2xl border border-white/5">
                                            <div className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1">İşletme Adı</div>
                                            <div className="font-bold text-xl">{tenant?.name}</div>
                                        </div>
                                        <div className="px-6 py-4 bg-black/40 rounded-2xl border border-white/5">
                                            <div className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1">E-Posta</div>
                                            <div className="font-bold text-lg">{tenant?.email || 'Tanımlanmamış'}</div>
                                        </div>
                                        <div className="px-6 py-4 bg-black/40 rounded-2xl border border-white/5">
                                            <div className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1">Telefon</div>
                                            <div className="font-bold text-lg">{tenant?.phone || 'Tanımlanmamış'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-900/30 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 space-y-8 flex flex-col justify-between">
                                    <div className="space-y-8">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                            <ShieldCheck size={14} /> GÜVENLİK
                                        </h3>
                                        <div className="p-8 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                                            <div className="text-[8px] font-black uppercase text-amber-500/60 tracking-widest mb-4 flex items-center gap-2 italic">
                                                <AlertCircle size={10} /> Kurtarma Kodu (PIN)
                                            </div>
                                            <div className="text-5xl font-black text-amber-500 tracking-[0.2em] mb-4 font-mono">{tenant?.recovery_pin || '0000'}</div>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide leading-relaxed">Şifrenizi unutursanız bu kodu kullanarak sıfırlama yapabilirsiniz. Güvenli bir yere kaydedin.</p>
                                        </div>
                                    </div>
                                    <button onClick={handleLogout} className="w-full py-6 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5">OTURUMU KALICI OLARAK KAPAT</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

const AppointmentCard = ({ appt, updateStatus, deleteAppointment }: { appt: any, updateStatus: any, deleteAppointment: any }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/30 backdrop-blur-md border border-white/5 p-8 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between group hover:border-primary/30 transition-all gap-8 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]" />

            <div className="flex items-center gap-8 w-full">
                <div className="w-20 h-20 bg-black/40 rounded-[2rem] flex flex-col items-center justify-center border border-white/5 group-hover:border-primary/20 transition-all shrink-0">
                    <span className="text-sm font-black text-primary italic leading-none">{appt.appointment_time.slice(0, 5)}</span>
                    <Clock size={16} className="text-zinc-600 mt-2" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-black text-2xl tracking-tighter uppercase group-hover:text-primary transition-colors">{appt.customer_name}</h3>
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${appt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                            appt.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                'bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                            }`}>
                            {appt.status === 'confirmed' ? 'Onaylandı' : appt.status === 'cancelled' ? 'İptal Edildi' : 'Randevu Bekliyor'}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-[10px] text-zinc-500 font-black uppercase tracking-[0.1em]">
                        <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><Phone size={14} className="text-primary" /> {appt.customer_phone}</span>
                        <span className="flex items-center gap-2"><Briefcase size={14} className="text-zinc-700" /> {appt.services?.name || 'Hizmet Seçilmedi'}</span>
                        {appt.staff && <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-zinc-700" /> {appt.staff.name}</span>}
                        <span className="flex items-center gap-2 italic opacity-60"><Calendar size={14} className="text-zinc-700" /> {new Date(appt.appointment_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-3 translate-x-4 group-hover:translate-x-0">
                    {appt.status !== 'confirmed' && (
                        <button
                            onClick={() => updateStatus(appt.id, 'confirmed')}
                            className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-emerald-500/10 group/btn active:scale-90"
                            title="Onayla"
                        >
                            <CheckCircle size={24} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                    )}
                    {appt.status !== 'cancelled' && (
                        <button
                            onClick={() => updateStatus(appt.id, 'cancelled')}
                            className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10 group/btn active:scale-90"
                            title="İptal Et"
                        >
                            <XCircle size={24} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                    )}
                    <button className="w-14 h-14 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all group/btn shadow-xl shadow-sky-500/5">
                        <Smartphone size={24} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button onClick={() => deleteAppointment(appt.id)} className="w-14 h-14 bg-zinc-800 text-zinc-500 rounded-2xl flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-all group/btn shadow-xl">
                        <Trash2 size={24} className="group-hover/btn:scale-110 transition-transform text-zinc-600 group-hover:text-red-400" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

export default Admin;
