import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: string, parts: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isOpen]);

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', parts: userMessage }]);
        setIsLoading(true);

        try {
            // Production/Dev API URL selection
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:3000/api/ai/chat'
                : 'https://randevu-sistemi.onrender.com/api/ai/chat';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory.map(item => ({ role: item.role, parts: [{ text: item.parts }] }))
                }),
            });

            const data = await response.json();

            if (data.text) {
                setChatHistory(prev => [...prev, { role: 'model', parts: data.text }]);
            } else {
                throw new Error(data.error || 'AI yanıt veremedi.');
            }
        } catch (error) {
            console.error('AI Error:', error);
            setChatHistory(prev => [...prev, { role: 'model', parts: 'Üzgünüm, şu an bağlantı kuramıyorum. Lütfen biraz sonra tekrar dene.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 w-[380px] h-[550px] bg-background/80 backdrop-blur-2xl border border-primary/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 bg-primary/10 border-b border-primary/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm tracking-tight">Codenza AI Asistan</h4>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Çevrimiçi</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-primary/10 rounded-xl transition-colors"
                                aria-label="Asistanı Kapat"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {chatHistory.length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="text-primary/40" size={32} />
                                    </div>
                                    <h5 className="text-sm font-bold mb-1">Selam! Ben Codenza Uzmanı.</h5>
                                    <p className="text-xs text-muted-foreground px-6 leading-relaxed">
                                        Randevu sistemimiz hakkında merak ettiğin her şeyi bana sorabilirsin.
                                    </p>
                                </div>
                            )}

                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md'
                                        : 'bg-muted/50 border border-muted-foreground/10 rounded-tl-none'
                                        }`}>
                                        {msg.parts}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-muted/50 border border-muted-foreground/10 p-4 rounded-3xl rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-background/50 border-t border-primary/5">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Bir soru sor..."
                                    className="w-full bg-muted/30 border border-transparent focus:border-primary/30 p-4 pr-12 rounded-2xl outline-none transition-all text-sm group-hover:bg-muted/50"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                    aria-label="Mesaj Gönder"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <p className="text-[9px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-medium opacity-50">
                                AI can make mistakes. powered by Gemini
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl shadow-glow-primary flex items-center justify-center relative overflow-hidden group"
                aria-label={isOpen ? "AI Asistanı Kapat" : "AI Asistanı Aç"}
                aria-haspopup="dialog"
            >
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                </motion.div>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
            </motion.button>
        </div>
    );
};

export default AIAssistant;
