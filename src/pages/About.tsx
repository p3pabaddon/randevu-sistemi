import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";

const About = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <section className="container mx-auto px-6 py-12 max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold mb-8"
                    >
                        Hakkımızda: <span className="text-primary">Geleceğin Randevu Sistemi</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-8 text-lg leading-relaxed"
                    >
                        <p className="text-xl text-muted-foreground italic">
                            "RandevuDunyasi, işletmelerin dijitalleşme sürecindeki en yakın dostu olma vizyonuyla kurulmuş bir Structly Solutions ürünüdür."
                        </p>

                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-2xl font-bold text-foreground mb-4">Misyonumuz</h2>
                            <p className="text-muted-foreground">
                                Yerel işletmelerden büyük kurumsal firmalara kadar her ölçekteki işletmenin, randevu yönetimini zahmetsiz, hatasız ve profesyonel bir şekilde yürütebilmesini sağlamaktır. Zamanın en değerli hazine olduğuna inanıyoruz; bu yüzden hem işletme sahiplerinin hem de müşterilerin bu hazineyi en verimli şekilde kullanmalarına aracı oluyoruz.
                            </p>

                            <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">Vizyonumuz</h2>
                            <p className="text-muted-foreground">
                                Türkiye'nin ve dünyanın en tercih edilen randevu pazaryeri ve işletme yönetim platformu haline gelmek. Teknolojiyi karmaşıklıktan arındırıp, herkesin kolayca kullanabileceği şık ve fonksiyonel araçlara dönüştürmek en büyük gayemizdir.
                            </p>

                            <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl mt-16 text-center">
                                <h2 className="text-2xl font-bold text-foreground mb-4">Bize Katılın</h2>
                                <p className="text-muted-foreground mb-8">
                                    İşinizi büyütmek ve modernleştirmek için çıktığımız bu yolda sizinle birlikte yürümekten mutluluk duyacağız.
                                </p>
                                <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
                                    <div className="px-6 py-3 bg-card border border-border rounded-full text-primary">✓ 50+ Sektör Entegrasyonu</div>
                                    <div className="px-6 py-3 bg-card border border-border rounded-full text-primary">✓ %100 Bulut Tabanlı</div>
                                    <div className="px-6 py-3 bg-card border border-border rounded-full text-primary">✓ 7/24 Teknik Destek</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default About;
