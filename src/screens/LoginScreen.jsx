import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(null);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes('your-project-url')) {
            setError('Configuração incompleta! Você esqueceu de colocar o URL do seu projeto Supabase no arquivo .env');
            return;
        }

        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) setError(error.message);
    };

    return (
        <div className="container justify-center">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass space-y-6"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-800">Boas-vindas! 🌈</h2>
                    <p className="text-slate-500">Faça login para brincar com seus amigos</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Qual seu e-mail?"
                        className="puffy w-full"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Sua senha secreta"
                        className="puffy w-full"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    {error && <p className="text-rose-500 text-sm text-center font-bold">{error}</p>}

                    <button type="submit" className="puffy w-full py-4 text-lg">
                        {isSignUp ? 'Criar minha conta' : 'Entrar no Jogo'}
                    </button>
                </form>

                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full text-slate-400 text-sm font-bold hover:text-indigo-600 transition-colors"
                >
                    {isSignUp ? 'Já tenho conta? Entrar' : 'Não tem conta? Criar uma agora'}
                </button>
            </motion.div>
        </div>
    );
}
