import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "Randevu Dünyası'nı kullanmaya nasıl başlarım?",
        answer: "WhatsApp üzerinden demo talep ederek hemen başlayabilirsiniz. Uzman ekibimiz işletmenize özel kurulumu saniyeler içinde tamamlayıp size giriş bilgilerini iletecektir.",
    },
    {
        question: "Ücretlendirme politikanız nasıl?",
        answer: "İşletmenizin hacmine ve ihtiyaç duyduğunuz özelliklere göre esnek paketlerimiz mevcuttur. Aylık veya yıllık ödeme seçenekleriyle, bütçenize en uygun çözümü sunuyoruz.",
    },
    {
        question: "Müşterilerim randevu aldığında bildirim gider mi?",
        answer: "Evet, sistemimiz randevu alındığında müşterilerinize otomatik WhatsApp onayı gönderir. Ayrıca randevu saatinden önce hatırlatma mesajları ile 'gelmeyen müşteri' oranını minimize eder.",
    },
    {
        question: "Verilerim güvende mi?",
        answer: "Verileriniz en yüksek güvenlik standartlarına sahip sunucularda saklanır ve düzenli olarak yedeklenir. Şifreleme algoritmalarımız sayesinde verilerinize sizden başka kimse erişemez.",
    },
    {
        question: "Var olan müşteri listemi sisteme aktarabilir miyim?",
        answer: "Kesinlikle! Mevcut müşteri listenizi Excel veya CSV formatında sisteme topluca yükleyebilir, kaldığınız yerden devam edebilirsiniz.",
    },
];

const FAQItem = ({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) => {
    return (
        <div className="border-b border-white/10 overflow-hidden">
            <button
                onClick={onClick}
                className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors focus:outline-none"
            >
                <span className="text-lg font-medium text-foreground">{question}</span>
                {isOpen ? <Minus className="w-5 h-5 flex-shrink-0" /> : <Plus className="w-5 h-5 flex-shrink-0" />}
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <p className="pb-6 text-muted-foreground leading-relaxed">
                    {answer}
                </p>
            </motion.div>
        </div>
    );
};

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-24 bg-card/30">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-primary font-medium text-sm tracking-wider uppercase"
                    >
                        Sıkça Sorulan Sorular
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-4 text-3xl font-bold text-foreground sm:text-5xl"
                    >
                        Aklınıza takılan her şeyi{" "}
                        <span className="gradient-text">cevaplıyoruz</span>
                    </motion.h2>
                </div>

                <div className="glass rounded-3xl p-8 md:p-12">
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
