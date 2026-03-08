import { motion } from "framer-motion";
import { useParams, Link, Navigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Calendar, User, ArrowLeft, Share2, MessageCircle } from "lucide-react";
import { blogPosts } from "./BlogPage";

const BlogPostPage = () => {
    const { slug } = useParams();
    const post = blogPosts.find(p => p.slug === slug);

    if (!post) return <Navigate to="/404" />;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 text-sm font-medium">
                            <ArrowLeft className="w-4 h-4" /> Tüm Yazılara Dön
                        </Link>

                        <div className="mb-12">
                            <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-6 inline-block">
                                {post.category}
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground border-b border-border pb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                        RD
                                    </div>
                                    <span>{post.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {post.date}
                                </div>
                            </div>
                        </div>

                        <div className="relative h-[400px] w-full mb-12 rounded-3xl overflow-hidden glass p-1">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        </div>

                        <div className="prose prose-invert prose-lg max-w-none mb-16">
                            {post.content.split('\n').map((para, i) => (
                                para.trim() ? <p key={i} className="mb-6 text-muted-foreground leading-relaxed text-lg">{para}</p> : <br key={i} />
                            ))}
                        </div>

                        {/* CTA Section */}
                        <div className="glass p-8 md:p-12 rounded-[2rem] border-primary/20 bg-primary/5 text-center">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">İşletmenizi Dijitalleştirmeye Hazır Mısınız?</h2>
                            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                                Tıpkı bu makalede okuduğunuz gibi, doğru teknoloji ile verimliliğinizi anında artırabilirsiniz. Randevu Dünyası'nı 14 gün boyunca tamamen ücretsiz deneyin.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="https://api.whatsapp.com/send?phone=905466767595&text=Blog%20yaz%C4%B1n%C4%B1z%C4%B1%20okudum,%20hemen%20başlamak%20istiyorum!"
                                    className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all"
                                >
                                    Ücretsiz Denemeyi Başlat
                                </a>
                                <button className="w-full sm:w-auto px-8 py-4 border border-border rounded-xl font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" /> Yazıyı Paylaş
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPostPage;
