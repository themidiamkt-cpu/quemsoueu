import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useGame() {
    const [user, setUser] = useState(null);
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const createGame = async (player2Email) => {
        // This is a simplified invite logic
        // In a real app, we'd find the user ID by email first
        const { data: guest } = await supabase.rpc('get_user_id_by_email', { email: player2Email });

        if (!guest) throw new Error('Jogador não encontrado!');

        const { data, error } = await supabase
            .from('games')
            .insert([
                {
                    player1_id: user.id,
                    player2_id: guest,
                    status: 'setup',
                    scores: { p1: 0, p2: 0 }
                }
            ])
            .select()
            .single();

        if (error) throw error;
        setGame(data);
        return data;
    };

    const subscribeToGame = (gameId) => {
        const channel = supabase
            .channel(`game:${gameId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
                setGame(payload.new);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    };

    const updateCharacter = async (gameId, playerKey, character) => {
        const column = playerKey === 'p1' ? 'player1_character' : 'player2_character';
        const { error } = await supabase
            .from('games')
            .update({ [column]: character })
            .eq('id', gameId);

        if (error) throw error;
    };

    return { user, game, setGame, loading, createGame, subscribeToGame, updateCharacter };
}
