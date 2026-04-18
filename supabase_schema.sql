-- ==========================================
-- 🚀 SCRIPT DE ATUALIZAÇÃO (RODE ESTE PRIMEIRO!)
-- ==========================================
-- Se você já tem a tabela 'games', rode apenas estas linhas abaixo:

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS room_code text;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS game_type text DEFAULT 'guess';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS board_state jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS current_turn text DEFAULT 'p1';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS turn_start_at timestamp with time zone;

-- ==========================================
-- 🛠️ ESTRUTURA COMPLETA (PARA NOVOS PROJETOS)
-- ==========================================
-- Se for a primeira vez criando o banco, você pode rodar tudo.
-- Mas se der erro de "already exists", ignore e rode apenas o bloco acima.

/*
CREATE TABLE IF NOT EXISTS public.games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    player1_id uuid REFERENCES auth.users(id),
    player2_id uuid REFERENCES auth.users(id),
    player1_character text,
    player2_character text,
    player1_name text,
    player2_name text,
    room_code text,
    game_type text DEFAULT 'guess',
    board_state jsonb DEFAULT '{}'::jsonb,
    current_turn text DEFAULT 'p1',
    turn_start_at timestamp with time zone,
    status text DEFAULT 'setup',
    scores jsonb DEFAULT '{"p1": 0, "p2": 0}'::jsonb
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;

-- RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own games" ON public.games
    FOR ALL USING (auth.uid() = player1_id OR auth.uid() = player2_id);
*/
