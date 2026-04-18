const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function getCharacterSuggestions(categoryName) {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API Key missing! Check your .env file.');
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
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
        return data.choices[0].message.content.split(',').map(name => name.trim());
    } catch (error) {
        console.error('Error fetching suggestions from OpenAI:', error);
        return null;
    }
}
