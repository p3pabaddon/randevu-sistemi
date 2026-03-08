import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, Clock, Wallet, CheckCircle2 } from "lucide-react";

const ROICalculator = () => {
    const [appointmentsPerDay, setAppointmentsPerDay] = useState(10);
    const [averagePrice, setAveragePrice] = useState(500);
    const [noShowRate, setNoShowRate] = useState(15);

    const [monthlyGain, setMonthlyGain] = useState(0);
    const [timeSaved, setTimeSaved] = useState(0);

    useEffect(() => {
        // Calculate gains: 
        // 1. Reduced no-shows (from X% to half with auto-reminders)
        // 2. Extra bookings (estimated 5% increase due to 7/24 availability)
        // 3. System Cost 
        const workingDays = 30; // Standard month
        const dailyRevenue = appointmentsPerDay * averagePrice;
        const currentMonthlyGross = dailyRevenue * workingDays;

        const lostToNoShows = currentMonthlyGross * (noShowRate / 100);
        const recoveredNoShows = lostToNoShows * 0.5; // We recover 50% of lost revenue
        const extraBookingsGain = currentMonthlyGross * 0.05;
        const systemCost = 3500; // Profesyonel Paket Fiyatı

        // "Ek Gelir" should show the gross value the system generates
        const totalValueAdd = Math.round(recoveredNoShows + extraBookingsGain);
        setMonthlyGain(totalValueAdd);

        // Time Saved: 10 mins per appointment (booking + reminders + management)
        setTimeSaved(Math.round(appointmentsPerDay * 10 * workingDays / 60));

        // New Monthly Revenue (Current Net + Value Add)
        const currentNetRevenue = currentMonthlyGross - lostToNoShows;
        setPotentialTotalRev(Math.round(currentNetRevenue + totalValueAdd));
    }, [appointmentsPerDay, averagePrice, noShowRate]);

    const [potentialTotalRev, setPotentialTotalRev] = useState(0);

    return (
        <section id="hesaplayici" className="py-24 relative overflow-hidden">
            <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-accent/5 blur-[150px]" />

            <div className="container mx-auto px-6 relative">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-primary font-medium text-sm tracking-wider uppercase"
                        >
                            Verimlilik Analizi
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-4 text-3xl font-bold text-foreground sm:text-5xl"
                        >
                            Kayıplarınızı{" "}
                            <span className="gradient-text">Kazanca Dönüştürün</span>
                        </motion.h2>
                        <p className="mt-4 text-muted-foreground text-lg">
                            Mevcut verilerinizi girin, dijitalleşmenin getirisini anında görün.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Inputs */}
                        <div className="glass rounded-3xl p-8 space-y-8">
                            <div>
                                <div className="flex justify-between mb-4">
                                    <label htmlFor="appointments-range" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Günlük Ortalama Randevu</label>
                                    <span className="text-primary font-bold">{appointmentsPerDay}</span>
                                </div>
                                <input
                                    id="appointments-range"
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={appointmentsPerDay}
                                    onChange={(e) => setAppointmentsPerDay(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    aria-label="Günlük Ortalama Randevu Sayısı"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-4">
                                    <label htmlFor="price-range" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Hizmet Başı Ortalama Ücret (TL)</label>
                                    <span className="text-primary font-bold">{averagePrice} ₺</span>
                                </div>
                                <input
                                    id="price-range"
                                    type="range"
                                    min="100"
                                    max="5000"
                                    step="100"
                                    value={averagePrice}
                                    onChange={(e) => setAveragePrice(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    aria-label="Hizmet Başı Ortalama Ücret"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-4">
                                    <label htmlFor="noshow-range" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mevcut "Gelmeyen Müşteri" Oranı</label>
                                    <span className="text-primary font-bold">%{noShowRate}</span>
                                </div>
                                <input
                                    id="noshow-range"
                                    type="range"
                                    min="5"
                                    max="40"
                                    value={noShowRate}
                                    onChange={(e) => setNoShowRate(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    aria-label="Gelmeyen Müşteri Oranı"
                                />
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Tahmini Günlük Ciro:</span>
                                    <span className="font-bold">{(appointmentsPerDay * averagePrice).toLocaleString('tr-TR')} ₺</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                    * Hesaplamalar aylık bazda (30 gün) 50% "gelmeyen müşteri" kurtarma ve 5% ek kapasite artışı üzerine kurgulanmıştır.
                                </p>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="bg-gradient-to-br from-primary/20 to-accent/20 border border-white/20 rounded-3xl p-8 backdrop-blur-xl relative z-10"
                            >
                                <div className="space-y-8">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/20 p-3 rounded-2xl">
                                            <Wallet className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Potansiyel Aylık Ek Gelir</p>
                                            <p className="text-4xl font-bold gradient-text">+{monthlyGain.toLocaleString('tr-TR')} ₺</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Yeni Aylık Ciro</p>
                                            <p className="text-xl font-bold">{potentialTotalRev.toLocaleString('tr-TR')} ₺</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Tasarruf Edilen Zaman</p>
                                            <p className="text-xl font-bold">{timeSaved} Saat</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                Otomatik hatırlatmalar ile kayıpları önleyin
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                7/24 randevu ile ek satış kanalı oluşturun
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                Yedek liste ile boşlukları doldurun
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href="https://api.whatsapp.com/send?phone=905466767595&text=ROI%20Hesaplay%C4%B1c%C4%B1%20ile%20kazanc%C4%B1m%C4%B1%20hesaplad%C4%B1m,%20hemen%20başlamak%20istiyorum!"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all hover:scale-[1.02]"
                                    >
                                        Hemen Bu Kazanca Ulaşın
                                        <TrendingUp className="w-5 h-5" />
                                    </a>
                                </div>
                            </motion.div>

                            {/* Decorative elements - added pointer-events-none to prevent blocking inputs */}
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
                            <div className="absolute -left-4 -top-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ROICalculator;
