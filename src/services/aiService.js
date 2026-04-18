const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

export async function getCharacterSuggestions(categoryName) {
    if (!OPENROUTER_API_KEY) {
        console.warn('API Key missing! Check your .env file.');
        return null;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://github.com/themidiamkt-cpu/quemsoueu',
                'X-Title': 'Quem Sou Eu Realtime',
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um assistente divertido de um jogo de adivinhação para crianças de 8 anos. Sugira uma lista de 5 personagens que uma criança dessa idade conheceria (desenhos, heróis, filmes infantis).'
                    },
                    {
                        role: 'user',
                        content: `Sugira 5 personagens da categoria: ${categoryName}. Retorne APENAS os nomes separados por vírgula, sem explicações.`
                    }
                ],
                temperature: 0.8,
            }),
        });

        const data = await response.json();
        console.log('OpenRouter Response:', data);
        return data.choices?.[0]?.message?.content?.split(',').map(name => name.trim()) || null;
    } catch (error) {
        console.error('Error fetching suggestions from OpenRouter:', error);
        return null;
    }
}
