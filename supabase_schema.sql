-- 1. Create the games table
CREATE TABLE IF NOT EXISTS public.games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    player1_id uuid REFERENCES auth.users(id),
    player2_id uuid REFERENCES auth.users(id),
    player1_character text,
    player2_character text,
    player1_name text,
    player2_name text,
    current_turn text DEFAULT 'p1',
    status text DEFAULT 'setup',
    scores jsonb DEFAULT '{"p1": 0, "p2": 0}'::jsonb
);

-- 2. Enable Realtime for the games table
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;

-- 3. Create a function to get user ID by email (Security restricted, run as postgres)
CREATE OR REPLACE FUNCTION get_user_id_by_email(email text)
RETURNS uuid AS $$
  SELECT id FROM auth.users WHERE email = $1 LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Set up Row Level Security (Optional but recommended)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own games" ON public.games
    FOR ALL USING (
        auth.uid() = player1_id OR auth.uid() = player2_id
    );
