import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ slug: '', password: '' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('randevu_tenant', JSON.stringify(data.tenant));
                sessionStorage.setItem('randevu_token', data.token);
                toast.success('Giriş başarılı! Panelinize yönlendiriliyorsunuz.');
                navigate('/admin');
            } else {
                toast.error(data.error || 'Giriş yapılamadı.');
            }
        } catch (error) {
            toast.error('Sunucu bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full delay-700" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-12 rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                <header className="text-center mb-12">
                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
                        <Calendar className="text-primary" size={40} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-3">
                        HOŞ <span className="text-primary not-italic">GELDİNİZ</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Yönetim Paneline Giriş Yapın</p>
                </header>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-4 flex items-center gap-2">
                            <ShieldCheck size={12} className="text-primary" /> İşletme Kodu (SLUG)
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Örn: salon-ayse"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg focus:bg-black/60 shadow-inner placeholder:text-zinc-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-4 flex items-center gap-2">
                            <ShieldCheck size={12} className="text-primary" /> Yönetici Şifresi
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 p-6 rounded-[1.5rem] outline-none focus:border-primary transition-all font-bold text-lg focus:bg-black/60 shadow-inner placeholder:text-zinc-700"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 mt-10"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><span className="ml-4">GİRİŞ YAP</span> <ArrowRight size={20} /></>}
                    </button>
                </form>

                <footer className="mt-12 text-center">
                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed">
                        RANDEVU DUNYASI GÜVENLİK ALTYAPISI <br /> TARAFINDAN KORUNMAKTADIR
                    </p>
                </footer>
            </motion.div>
        </div>
    );
};

export default Login;
