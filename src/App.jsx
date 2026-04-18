import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Users,
  ChevronRight,
  Check,
  X,
  HelpCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  Send,
  Zap
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { useGame } from './hooks/useGame';
import { getCharacterSuggestions } from './services/aiService';
import { categories } from './data/characters';
import LoginScreen from './screens/LoginScreen';

// Base UI Component
const ButtonPuffy = ({ children, onClick, variant = 'yellow', className = '', disabledRef }) => {
  const styles = {
    yellow: 'puffy',
    pink: 'puffy puffy-pink',
    blue: 'bg-sky-400 text-white shadow-[0_8px_0_#0284c7] hover:bg-sky-500', // Added manual blue style
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={`px-6 py-4 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabledRef}
    >
      {children}
    </motion.button>
  );
};

export default function App() {
  const { user, game, setGame, loading, createGame, subscribeToGame, updateCharacter } = useGame();
  const [inviteEmail, setInviteEmail] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [localCharacter, setLocalCharacter] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  useEffect(() => {
    if (game?.id) {
      const unsubscribe = subscribeToGame(game.id);
      return unsubscribe;
    }
  }, [game?.id]);

  if (loading) return <div className="container justify-center"><h1 className="text-center font-black text-primary text-3xl animate-bounce">Carregando... 🎈</h1></div>;
  if (!user) return <LoginScreen />;

  const handleInvite = async () => {
    try {
      await createGame(inviteEmail);
    } catch (err) {
      alert(err.message);
    }
  };

  const generateAiSuggestions = async () => {
    setIsAiLoading(true);
    const result = await getCharacterSuggestions(activeCategory.name);
    if (result) setSuggestions(result);
    setIsAiLoading(false);
  };

  const handleConfirmCharacter = async () => {
    const playerKey = game.player1_id === user.id ? 'p1' : 'p2';
    // When I choose, I am setting the opponent's character
    const targetKey = playerKey === 'p1' ? 'p2' : 'p1';
    await updateCharacter(game.id, targetKey, localCharacter);
    setLocalCharacter('');
  };

  // Views
  const renderLobby = () => (
    <div className="container justify-center">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black text-slate-800 tracking-tighter">
            Quem Sou <br /><span className="text-secondary">EU?</span> <span className="inline-block animate-bounce text-5xl">🤔</span>
          </h1>
          <p className="text-slate-500 font-bold">Convide um amigo para começar!</p>
        </div>

        <div className="glass space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Email do Amigo</label>
            <div className="relative">
              <input
                type="email"
                placeholder="amigo@email.com"
                className="puffy w-full pr-14"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              <button onClick={handleInvite} className="absolute right-2 top-2 p-3 bg-secondary text-white rounded-xl shadow-[0_4px_0_#cc3a7c]">
                <Send size={20} />
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center gap-2">
            <button onClick={() => supabase.auth.signOut()} className="text-slate-400 font-bold text-xs hover:text-rose-500">
              Sair da conta
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderSetup = () => {
    const isP1 = game.player1_id === user.id;
    const myChoiceDone = isP1 ? !!game.player2_character : !!game.player1_character;
    const opponentChoiceDone = isP1 ? !!game.player1_character : !!game.player2_character;

    return (
      <div className="container justify-center">
        <div className="glass space-y-8 text-center animate-slide-up">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-800">
              {myChoiceDone ? 'Aguardando o outro... ⏳' : 'Quem o outro jogador será?'}
            </h2>
            {!myChoiceDone && <p className="text-slate-500 font-bold">Escolha um personagem para seu amigo!</p>}
          </div>

          {!myChoiceDone && (
            <div className="space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap font-bold text-xs transition-all ${activeCategory.id === cat.id ? 'bg-secondary text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome do personagem..."
                  value={localCharacter}
                  onChange={e => setLocalCharacter(e.target.value)}
                  className="puffy w-full text-center text-xl"
                />
              </div>

              <div className="space-y-3 pt-4 border-t-2 border-dashed border-slate-100">
                <button
                  onClick={generateAiSuggestions}
                  disabled={isAiLoading}
                  className="w-full h-16 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black shadow-[0_6px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all px-4"
                >
                  <Zap size={24} fill="currentColor" />
                  {isAiLoading ? 'CHAMANDO CHAT GPT...' : 'GERAR COM CHAT GPT! 🤖'}
                </button>

                <p className="text-[10px] text-slate-400 font-bold uppercase">Sugestões mágicas para crianças de 8 anos</p>

                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLocalCharacter(s)}
                      className="bg-white text-sky-600 px-4 py-2 rounded-full text-sm font-black border-2 border-sky-100 shadow-sm hover:bg-sky-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <ButtonPuffy
                variant="pink"
                className="w-full"
                onClick={handleConfirmCharacter}
                disabledRef={!localCharacter}
              >
                TUDO PRONTO! <Check size={24} />
              </ButtonPuffy>
            </div>
          )}

          {myChoiceDone && !opponentChoiceDone && (
            <div className="py-12 flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                <RotateCcw size={48} className="text-amber-500" />
              </div>
              <p className="text-slate-400 font-bold italic">Seu amigo ainda está escolhendo...</p>
            </div>
          )}

          {myChoiceDone && opponentChoiceDone && (
            <ButtonPuffy variant="blue" className="w-full" onClick={() => updateCharacter(game.id, 'status', 'playing')}>
              O JOGO VAI COMEÇAR! 🚀
            </ButtonPuffy>
          )}
        </div>
      </div>
    );
  };

  const renderPlaying = () => {
    const isP1 = game.player1_id === user.id;
    const mySecretChar = isP1 ? game.player1_character : game.player2_character;
    const opponentChar = isP1 ? game.player2_character : game.player1_character;

    return (
      <div className="container">
        <div className="text-center mb-8">
          <div className="inline-block glass bg-secondary border-secondary shadow-lg py-2 px-6 rounded-full">
            <p className="text-white font-black text-sm tracking-widest uppercase">VOCÊ É:</p>
          </div>
          <div className="mt-4 glass p-10 bg-white border-2 border-dashed border-slate-200 relative">
            <span className="text-slate-300 absolute top-4 left-4 font-black">?</span>
            <span className="text-slate-300 absolute bottom-4 right-4 font-black">?</span>
            <h2 className="text-4xl font-black text-slate-800">
              {mySecretChar}
            </h2>
          </div>
          <p className="mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
            Você sabe quem o seu amigo é ({opponentChar}), <br />mas você deve adivinhar o SEU!
          </p>
        </div>

        <div className="flex-1 space-y-4 flex flex-col justify-center">
          <ButtonPuffy variant="yellow" className="h-24 text-2xl">
            <HelpCircle size={32} /> Perguntar!
          </ButtonPuffy>

          <div className="grid grid-cols-2 gap-4">
            <ButtonPuffy variant="pink" className="h-20" onClick={() => confetti()}>
              ACERTEI! 🎉
            </ButtonPuffy>
            <ButtonPuffy variant="yellow" className="h-20 bg-slate-200 shadow-[0_8px_0_#94a3b8]" onClick={() => setGame(null)}>
              DESISTO 🏳️
            </ButtonPuffy>
          </div>
        </div>
      </div>
    );
  };

  if (!game) return renderLobby();
  if (game.status === 'setup') return renderSetup();
  if (game.status === 'playing') return renderPlaying();

  return null;
}
