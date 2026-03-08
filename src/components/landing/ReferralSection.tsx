import { motion } from "framer-motion";
import { Gift, Heart, Users, ArrowRight, CheckCircle2 } from "lucide-react";

const ReferralSection = () => {
    return (
        <section id="referans" className="py-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] -mr-64 -mt-64" />

            <div className="container mx-auto px-6 relative">
                <div className="glass rounded-[3rem] p-8 md:p-16 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8"
                            >
                                <Gift className="w-4 h-4" /> Arkadaşını Getir Programı
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-4xl md:text-6xl font-bold mb-8 leading-tight"
                            >
                                Paylaştıkça <span className="gradient-text">Birlikte Kazanalım</span>
                            </motion.h2>

                            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                                STRUCTLY'yi başka bir işletme sahibine tavsiye edin, her ikiniz de kazanın. Topluluğumuzu birlikte büyütüyoruz.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "Siz Kazanın", desc: "Tavsiye ettiğiniz her yeni üye için 1 ay ücretsiz kullanım kazanın." },
                                    { title: "Arkadaşınız Kazansın", desc: "Arkadaşınız da ilk ayı için %50 indirim veya ekstra 1 ay hediye alsın." },
                                    { title: "Sınırsız Tavsiye", desc: "Ne kadar çok işletme getirirseniz, o kadar çok hediye süre kazanırsınız." }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-4"
                                    >
                                        <div className="mt-1">
                                            <CheckCircle2 className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                                            <p className="text-muted-foreground text-sm">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="mt-12"
                            >
                                <a
                                    href="https://api.whatsapp.com/send?phone=905466767595&text=Referans%20sistemi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20"
                                >
                                    Referans Kodunu Al <ArrowRight className="w-5 h-5" />
                                </a>
                            </motion.div>
                        </div>

                        <div className="relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative z-10"
                            >
                                <div className="glass-strong rounded-[2.5rem] p-1 shadow-2xl skew-y-3 hover:skew-y-0 transition-all duration-700">
                                    <img
                                        src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800"
                                        alt="Referral Program"
                                        className="rounded-[2rem] w-full grayscale-[0.2] hover:grayscale-0 transition-all"
                                    />
                                </div>

                                {/* Floating Badges */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-8 -right-8 glass p-6 rounded-2xl shadow-xl border-primary/30"
                                >
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Hediye Süre</p>
                                        <p className="text-3xl font-bold gradient-text">+30 GÜN</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-8 -left-8 glass p-6 rounded-2xl shadow-xl border-accent/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-accent/20 rounded-lg">
                                            <Heart className="w-6 h-6 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">12 İşletme</p>
                                            <p className="text-xs text-muted-foreground">Tavsiye ile katıldı</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Decorative Blur */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] -z-10" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReferralSection;
