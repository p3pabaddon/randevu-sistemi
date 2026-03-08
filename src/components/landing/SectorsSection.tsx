import { motion } from "framer-motion";
import { Scissors, Stethoscope, Briefcase, Dumbbell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const sectors = [
    {
        icon: Scissors,
        title: "Kuaför & Güzellik",
        slug: "kuafor-ve-guzellik",
        description: "Online randevu, stok takibi ve müşteri sadakat programları ile salonunuzu büyütün.",
        color: "bg-pink-500/10 text-pink-500",
    },
    {
        icon: Stethoscope,
        title: "Sağlık & Klinik",
        slug: "saglik-ve-klinik",
        description: "Hasta takibi ve randevu hatırlatıcıları ile kliniğinizde verimliliği artırın.",
        color: "bg-blue-500/10 text-blue-500",
    },
    {
        icon: Dumbbell,
        title: "Spor & Fitness",
        slug: "spor-ve-fitness",
        description: "Ders kapasite yönetimi ve abonelik takibi için profesyonel çözüm.",
        color: "bg-green-500/10 text-green-500",
    },
    {
        icon: Briefcase,
        title: "Danışmanlık",
        slug: "danismanlik",
        description: "Psikologlar, avukatlar ve danışmanlar için özel takvim yönetimi.",
        color: "bg-purple-500/10 text-purple-500",
    },
];

const SectorsSection = () => {
    return (
        <section id="sectors" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-primary font-medium text-sm tracking-wider uppercase"
                    >
                        Sektörel Çözümler
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-4 text-3xl font-bold text-foreground sm:text-5xl"
                    >
                        Hangi sektördeyseniz,{" "}
                        <span className="gradient-text">size uygun bir çözümümüz</span> var
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {sectors.map((sector, index) => (
                        <motion.div
                            key={sector.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <Link
                                to={`/sektor/${sector.slug}`}
                                className="block glass p-8 rounded-2xl hover:border-primary/30 transition-all h-full"
                            >
                                <div className={`w-12 h-12 rounded-xl ${sector.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <sector.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-4">{sector.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                    {sector.description}
                                </p>
                                <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                                    İncele <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SectorsSection;
