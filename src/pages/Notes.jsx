
import React, { useState, useEffect } from 'react';
import { generateContent } from '../services/geminiService';
import { useGamification } from '../hooks/useGamification';
import { PenTool, Brain, Save, Loader2, GraduationCap, MessageSquare, Wand2 } from 'lucide-react';
import clsx from 'clsx';

const Notes = () => {
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('studyNotes');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeNote, setActiveNote] = useState(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('write'); // 'write' or 'teach'
    const { addXP } = useGamification();

    useEffect(() => {
        if (activeNote) {
            setContent(activeNote.content);
            setTitle(activeNote.title);
            setAiResponse(null);
        } else {
            setContent('');
            setTitle('');
            setAiResponse(null);
        }
    }, [activeNote]);

    const saveNote = () => {
        if (!title.trim()) return;

        const newNote = {
            id: activeNote?.id || Date.now(),
            title,
            content,
            updatedAt: new Date().toISOString()
        };

        let newNotes;
        if (activeNote) {
            newNotes = notes.map(n => n.id === activeNote.id ? newNote : n);
        } else {
            newNotes = [newNote, ...notes];
        }

        setNotes(newNotes);
        localStorage.setItem('studyNotes', JSON.stringify(newNotes));
        setActiveNote(newNote);
        addXP(10); // Simple save XP
    };

    const handleAiAction = async (action) => {
        if (!content.trim()) return;
        setLoading(true);
        setAiResponse(null);

        try {
            let prompt = '';
            if (action === 'simplify') {
                prompt = `Simplify the following text for a 5-year-old:\n\n${content}`;
            } else if (action === 'quiz') {
                prompt = `Generate 3 quick quiz questions based on this text:\n\n${content}`;
            } else if (action === 'grade') {
                prompt = `
                    I am trying to explain the concept of "${title}".
                    Review my explanation below. Grade it (A-F), correct any mistakes, and tell me what I missed.
                    
                    My Explanation:
                    ${content}
                `;
            }

            const response = await generateContent(prompt);
            setAiResponse(response);
            if (action === 'grade') addXP(100); // Big XP for teaching
        } catch (error) {
            console.error(error);
            setAiResponse("AI is having trouble right now. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20 h-[calc(100vh-2rem)] flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                        <PenTool className="w-8 h-8 text-primary-start" />
                        Smart Notes
                    </h1>
                    <p className="mt-2 text-gray-400">Write, learn, and teach with AI assistance.</p>
                </div>
                {activeNote && (
                    <div className="flex gap-2">
                        <button
                            onClick={saveNote}
                            className="bg-primary-start hover:bg-primary-end text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                        >
                            <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                            onClick={() => setActiveNote(null)}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                {/* Sidebar: Note List */}
                {!activeNote && (
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => setActiveNote({ id: null, title: 'New Note', content: '' })}
                            className="h-32 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-primary-start transition-all"
                        >
                            <PenTool className="w-8 h-8 mb-2" />
                            Create New Note
                        </button>
                        {notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => setActiveNote(note)}
                                className="h-32 bg-gray-800/50 border border-gray-700 rounded-2xl p-4 hover:border-gray-500 cursor-pointer transition-all flex flex-col"
                            >
                                <h3 className="font-bold text-white mb-2 truncate">{note.title}</h3>
                                <p className="text-xs text-gray-400 flex-1 overflow-hidden line-clamp-3">
                                    {note.content}
                                </p>
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Editor Area */}
                {activeNote && (
                    <>
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <div className="flex gap-2 mb-2 p-1 bg-gray-800/50 rounded-xl w-fit">
                                <button
                                    onClick={() => setMode('write')}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                        mode === 'write' ? "bg-primary-start text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <PenTool className="w-4 h-4" /> Write
                                </button>
                                <button
                                    onClick={() => setMode('teach')}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                        mode === 'teach' ? "bg-purple-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <GraduationCap className="w-4 h-4" /> Teach Me (Feynman)
                                </button>
                            </div>

                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Note Title"
                                className="bg-transparent text-2xl font-bold text-white border-none outline-none placeholder-gray-600 w-full"
                            />

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={mode === 'teach' ? "Explain the concept here as if you're teaching it..." : "Start typing your notes..."}
                                className={clsx(
                                    "flex-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary-start/50 leading-relaxed font-mono",
                                    mode === 'teach' ? "border-purple-500/20 bg-purple-500/5" : ""
                                )}
                            />
                        </div>

                        {/* AI Sidebar */}
                        <div className="lg:col-span-1 bg-gray-800/30 border-l border-gray-800 p-4 flex flex-col gap-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Brain className="w-4 h-4" /> AI Tutor
                            </h3>

                            {mode === 'write' ? (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleAiAction('simplify')}
                                        disabled={loading || !content}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl text-sm font-medium transition-colors text-left flex items-center gap-2 border border-gray-700"
                                    >
                                        <Wand2 className="w-4 h-4 text-primary-start" /> Simplify Text
                                    </button>
                                    <button
                                        onClick={() => handleAiAction('quiz')}
                                        disabled={loading || !content}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl text-sm font-medium transition-colors text-left flex items-center gap-2 border border-gray-700"
                                    >
                                        <MessageSquare className="w-4 h-4 text-green-400" /> Generate Quiz
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-sm text-purple-200">
                                        <p className="mb-2"><strong>The Feynman Technique:</strong></p>
                                        <ul className="list-disc pl-4 space-y-1 text-xs opacity-80">
                                            <li>Choose a concept.</li>
                                            <li>Explain it simply.</li>
                                            <li>Identify gaps.</li>
                                            <li>Review and simplify.</li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => handleAiAction('grade')}
                                        disabled={loading || !content}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-purple-600/20"
                                    >
                                        Grade My Explanation
                                    </button>
                                </div>
                            )}

                            {/* Response Area */}
                            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-y-auto custom-scrollbar text-sm text-gray-300">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Thinking...
                                    </div>
                                ) : aiResponse ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-600 h-full flex flex-col items-center justify-center">
                                        <p>Select text or write an explanation to get AI feedback.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Notes;
