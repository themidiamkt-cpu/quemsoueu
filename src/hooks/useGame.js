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

    const createRoom = async (p1Name) => {
        if (!user) return;

        // Generate a simple 6-char code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data, error } = await supabase
            .from('games')
            .insert([
                {
                    player1_id: user.id,
                    player1_name: p1Name || 'Jogador 1',
                    player2_id: null, // Open for anyone with the code
                    room_code: code,
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

    const joinRoom = async (code, p2Name) => {
        if (!user || !code) return;

        const cleanCode = code.trim().toUpperCase();

        // 1. Find the room
        const { data: room, error: findError } = await supabase
            .from('games')
            .select('*')
            .eq('room_code', cleanCode)
            .eq('status', 'setup')
            .maybeSingle();

        if (findError) throw findError;
        if (!room) throw new Error('Sala não encontrada! Verifique o código.');
        if (room.player1_id === user.id) {
            setGame(room);
            return room;
        }

        // 2. Join the room
        const { data: joined, error: joinError } = await supabase
            .from('games')
            .update({
                player2_id: user.id,
                player2_name: p2Name || 'Jogador 2'
            })
            .eq('id', room.id)
            .select()
            .single();

        if (joinError) throw joinError;
        setGame(joined);
        return joined;
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

    const updateGame = async (gameId, updates) => {
        const { data, error } = await supabase
            .from('games')
            .update(updates)
            .eq('id', gameId)
            .select()
            .single();

        if (error) throw error;
        if (data) setGame(data);
    };

    const fetchGame = async () => {
        if (!game?.id) return;
        const { data } = await supabase
            .from('games')
            .select('*')
            .eq('id', game.id)
            .single();

        if (data) setGame(data);
    };

    const exitRoom = async () => {
        if (!game || !user) {
            setGame(null);
            return;
        }

        try {
            const isP1 = game.player1_id === user.id;
            if (isP1) {
                // P1 closes the room
                await supabase.from('games').update({ status: 'cancelled' }).eq('id', game.id);
            } else {
                // P2 just leaves the room
                await supabase.from('games').update({ player2_id: null }).eq('id', game.id);
            }
        } catch (err) {
            console.error("Erro ao sair da sala:", err);
        } finally {
            setGame(null);
        }
    };

    return { user, game, setGame, loading, createRoom, joinRoom, exitRoom, subscribeToGame, updateGame, fetchGame };
}
