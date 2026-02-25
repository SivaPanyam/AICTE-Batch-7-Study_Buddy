
import React, { useState } from 'react';
import { generateJSON } from '../services/geminiService';
import FlashcardDeck from '../components/FlashcardDeck';
import { Copy, Loader2, Play, Plus, Book, MoreVertical, Trash2 } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

const Flashcards = () => {
    const [decks, setDecks] = useState(() => {
        const saved = localStorage.getItem('flashcardDecks');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeDeck, setActiveDeck] = useState(null);
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState('');
    const { addXP } = useGamification();

    const saveDecks = (newDecks) => {
        setDecks(newDecks);
        localStorage.setItem('flashcardDecks', JSON.stringify(newDecks));
    };

    const generateDeck = async () => {
        if (!topic.trim()) return;
        setLoading(true);

        try {
            const prompt = `
                Create a set of 8 flashcards for the topic: "${topic}".
                Each flashcard should have a "front" (question/concept) and "back" (answer/definition).
                Keep the content concise and suitable for active recall.

                Return STRICT JSON:
                {
                  "cards": [
                    { "front": "What is...", "back": "It is..." },
                    ...
                  ]
                }
            `;

            const data = await generateJSON(prompt);

            const newDeck = {
                id: Date.now(),
                title: topic,
                cards: data.cards,
                createdAt: new Date().toISOString()
            };

            saveDecks([newDeck, ...decks]);
            setTopic('');
            addXP(20); // XP for creating material
        } catch (error) {
            console.error(error);
            alert("Failed to generate cards. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const deleteDeck = (id) => {
        if (confirm("Delete this deck?")) {
            saveDecks(decks.filter(d => d.id !== id));
        }
    };

    if (activeDeck) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <button
                    onClick={() => setActiveDeck(null)}
                    className="text-gray-400 hover:text-white mb-6 flex items-center gap-2"
                >
                    &larr; Back to Decks
                </button>

                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">{activeDeck.title}</h1>
                    <p className="text-gray-400">{activeDeck.cards.length} Cards</p>
                </header>

                <FlashcardDeck
                    cards={activeDeck.cards}
                    onComplete={() => addXP(50)} // XP for finishing a deck
                />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                    <Copy className="w-8 h-8 text-primary-start" />
                    Flashcards
                </h1>
                <p className="mt-2 text-gray-400">Master concepts through active recall.</p>
            </header>

            {/* Generator */}
            <div className="bg-card border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a topic (e.g., 'JavaScript Promises' or 'Anatomy 101')"
                        className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-start"
                        onKeyDown={(e) => e.key === 'Enter' && generateDeck()}
                    />
                    <button
                        onClick={generateDeck}
                        disabled={loading || !topic.trim()}
                        className="bg-primary-start text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-end disabled:opacity-50 flex items-center justify-center gap-2 min-w-[160px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Generate Deck
                    </button>
                </div>
            </div>

            {/* Decks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map(deck => (
                    <div key={deck.id} className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 hover:border-gray-500 transition-all group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                            <Book className="w-6 h-6 text-blue-400" />
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-2 truncate">{deck.title}</h3>
                        <p className="text-sm text-gray-400 mb-6">{deck.cards.length} Cards</p>

                        <button
                            onClick={() => setActiveDeck(deck)}
                            className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700 border border-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Play className="w-4 h-4" /> Study Now
                        </button>
                    </div>
                ))}

                {decks.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Copy className="w-8 h-8 text-gray-600" />
                        </div>
                        <p>No decks yet. Generate one to start studying!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Flashcards;
