
import React, { useState } from 'react';
import { RotateCcw, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

const FlashcardDeck = ({ cards = [], onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [completed, setCompleted] = useState(false);

    const currentCard = cards[currentIndex];

    const handleFlip = () => setIsFlipped(!isFlipped);

    const nextCard = () => {
        setIsFlipped(false);
        if (currentIndex < cards.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        } else {
            setCompleted(true);
            if (onComplete) onComplete();
        }
    };

    const handleRate = (difficulty) => {
        // Here you would typically save the SRS result
        console.log(`Rated card ${currentCard.id} as ${difficulty}`);
        nextCard();
    };

    if (completed) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Deck Completed!</h3>
                <p className="text-gray-400 mb-6">Great job reviewing these cards.</p>
                <button
                    onClick={() => {
                        setCompleted(false);
                        setCurrentIndex(0);
                    }}
                    className="flex items-center gap-2 text-primary-start hover:text-white transition-colors"
                >
                    <RotateCcw className="w-4 h-4" /> Review Again
                </button>
            </div>
        );
    }

    if (!currentCard) return <div className="text-center text-gray-500">No cards in deck.</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4 flex justify-between text-sm text-gray-400">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span>{completed ? 100 : Math.round((currentIndex / cards.length) * 100)}%</span>
            </div>

            {/* Card Container */}
            <div
                className="group perspective-1000 w-full h-80 cursor-pointer"
                onClick={handleFlip}
            >
                <div className={clsx(
                    "relative w-full h-full transition-all duration-500 transform-style-3d",
                    isFlipped ? "rotate-y-180" : ""
                )}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-card border border-gray-700/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl hover:border-primary-start/30 transition-colors">
                        <span className="text-xs uppercase font-bold text-gray-500 mb-4 tracking-wider">Question</span>
                        <h3 className="text-2xl font-semibold text-white leading-relaxed">
                            {currentCard.front}
                        </h3>
                        <p className="absolute bottom-6 text-xs text-gray-500 animate-pulse">Click to flip</p>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-800 border border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                        <span className="text-xs uppercase font-bold text-green-400 mb-4 tracking-wider">Answer</span>
                        <p className="text-lg text-gray-200 leading-relaxed">
                            {currentCard.back}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            {isFlipped ? (
                <div className="flex justify-center gap-4 mt-8 animate-in slide-in-from-bottom-4 fade-in">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleRate('hard'); }}
                        className="px-6 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-medium transition-colors"
                    >
                        Hard
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleRate('medium'); }}
                        className="px-6 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 font-medium transition-colors"
                    >
                        Medium
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleRate('easy'); }}
                        className="px-6 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 font-medium transition-colors"
                    >
                        Easy
                    </button>
                </div>
            ) : (
                <div className="flex justify-center mt-8 opacity-0 pointer-events-none">
                    {/* Placeholder to keep layout stable */}
                    <button className="px-6 py-2">Hard</button>
                </div>
            )}
        </div>
    );
};

export default FlashcardDeck;
