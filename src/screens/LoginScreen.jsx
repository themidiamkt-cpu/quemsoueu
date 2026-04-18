import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Gamepad2 } from 'lucide-react';

const FloatingDecor = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="floating-decor float-slow top-10 left-10 text-rose-300"><Star size={40} /></div>
        <div className="floating-decor float-fast top-1/4 right-20 text-blue-300"><Gamepad2 size={32} /></div>
        <div className="floating-decor float-slow bottom-20 left-1/4 text-purple-300"><Gamepad2 size={48} /></div>
        <div className="floating-decor float-fast bottom-40 right-10 text-rose-200"><Star size={24} /></div>
    </div>
);

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = isRegistering
                ? await supabase.auth.signUp({ email, password })
                : await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="child-container flex flex-col justify-center min-h-screen items-center px-4 relative">
            <FloatingDecor />

            <div className="w-full max-w-[360px] relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-hero text-black text-4xl mb-2">
                        🎯 Quem Sou <span className="text-primary italic">Eu?</span>
                    </h1>
                    <p className="text-sm font-bold text-black opacity-50">
                        Entre para jogar com seus amigos
                    </p>
                </div>

                <div className="white-card">
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Seu e-mail 📧"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-child h-16 text-base"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Sua senha 🔒"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-child h-16 text-base"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 text-rose-500 text-[10px] font-black p-3 rounded-xl border border-rose-100 uppercase tracking-wider">
                                ❌ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn-puffy btn-purple text-white w-full h-16 text-base ${loading ? 'opacity-50' : ''}`}
                        >
                            {loading ? 'CARREGANDO... 🎈' : (isRegistering ? '🎮 CRIAR CONTA ✨' : '🎮 ENTRAR NO JOGO')}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-xs font-black text-black opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
                        >
                            {isRegistering ? 'Já tenho conta? Entrar 🔑' : 'Não tem conta? Criar conta ✨'}
                        </button>
                    </div>
                </div>

                <p className="text-[10px] font-black opacity-20 text-center mt-8 uppercase tracking-[0.2em]">
                    Um jogo para duplas divertidas
                </p>
            </div>
        </div>
    );
}
