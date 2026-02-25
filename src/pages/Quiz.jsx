import React, { useState, useEffect } from 'react';
import { generateJSON } from '../services/geminiService';
import { BrainCircuit, CheckCircle, XCircle, Loader2, Play, RefreshCw, Trophy, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import { getToday } from '../utils/dateUtils';
import { useGamification } from '../hooks/useGamification';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Quiz = () => {
    const { user } = useAuth();
    const { addXP } = useGamification();
    const [loading, setLoading] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [error, setError] = useState(null);
    const [topics, setTopics] = useState([]);
    const [todaysTopic, setTodaysTopic] = useState(null);
    const [isMockInterview, setIsMockInterview] = useState(false);

    // Load available topics from Goals
    useEffect(() => {
        const fetchTopics = async () => {
            let userPlans = [];
            if (user) {
                const { data } = await supabase.from('study_plans').select('*').limit(3);
                userPlans = data || [];
            } else {
                const saved = localStorage.getItem('studyGoalPlans');
                if (saved) userPlans = JSON.parse(saved);
            }

            if (userPlans.length > 0) {
                const allTasks = [];
                let todayFocus = null;

                userPlans.forEach(plan => {
                    plan.weeks.forEach(week => {
                        week.days.forEach(day => {
                            allTasks.push(...day.tasks.map(t => typeof t === 'string' ? t : t.description));

                            // heuristic: find first incomplete day's focus as today's topic
                            const dayCompleted = (day.tasks || []).every(t => t.completed);
                            if (!todayFocus && !dayCompleted) {
                                todayFocus = day.focus;
                            }
                        });
                    });
                });

                // Shuffle and set topics
                const shuffled = allTasks.sort(() => 0.5 - Math.random());
                setTopics(shuffled.slice(0, 5));
                if (todayFocus) setTodaysTopic(todayFocus);
            }
        };

        fetchTopics();
    }, [user]);

    const generateQuiz = async (manualTopic = null) => {
        // Determine active topic
        let activeTopic = manualTopic;
        if (!activeTopic) {
            if (todaysTopic) activeTopic = todaysTopic;
            else if (topics.length > 0) activeTopic = topics[0];
        }

        if (!activeTopic && topics.length === 0) {
            setError("No study topics found! Create a Goal Plan or enter a topic manually.");
            return;
        }

        setLoading(true);
        setError(null);
        setQuiz(null);
        setAnswers({});
        setShowResults(false);
        setCurrentQuestionIndex(0);

        try {
            const questionCount = isMockInterview ? 5 : 10;
            const context = activeTopic ? `Topic: ${activeTopic}` : `Topics: ${topics.join(", ")}`;

            const prompt = isMockInterview
                ? `
                    Generate a Mock Interview Quiz for a student preparing for: ${context}.
                    Create ${questionCount} conceptual, interview-style multiple-choice questions.
                    The questions should test deep understanding, scenario-based problem solving, or technical theory.
                    
                    Return STRICT JSON format:
                    {
                      "questions": [
                        {
                          "type": "mcq",
                          "question": "Scenario/Concept question?",
                          "options": ["Detailed Option A", "Detailed Option B", "Detailed Option C", "Detailed Option D"],
                          "correct_answer": "Detailed Option A",
                          "explanation": "Why this is correct (brief)"
                        }
                      ]
                    }
                    Ensure correct_answer matches one option exactly.
                `
                : `
                    Generate a standard multiple-choice quiz based on: ${context}.
                    Create ${questionCount} questions.
                    
                    Return STRICT JSON format:
                    {
                      "questions": [
                        {
                          "type": "mcq",
                          "question": "Question text?",
                          "options": ["Option A", "Option B", "Option C", "Option D"],
                          "correct_answer": "Option A" 
                        }
                      ]
                    }
                    Ensure correct_answer matches one option exactly.
                `;

            const data = await generateJSON(prompt);

            if (!data || !data.questions || !Array.isArray(data.questions)) {
                throw new Error("Invalid quiz format received");
            }

            setQuiz(data);
        } catch (err) {
            setError(`Failed to generate quiz: ${err.message || err.toString()}`);
            console.error("Full API Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (option) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateScore();
        }
    };

    const calculateScore = () => {
        let newScore = 0;
        quiz.questions.forEach((q, index) => {
            if (answers[index] === q.correct_answer) {
                newScore++;
            }
        });
        setScore(newScore);
        setShowResults(true);

        if (newScore === quiz.questions.length) {
            addXP(20); // Bonus XP
            alert("Perfect Score! You earned +20 XP!");
        } else {
            addXP(10); // Participation XP
        }

        // Save history
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        history.push({
            date: new Date().toISOString(),
            score: newScore,
            total: quiz.questions.length,
            topics: todaysTopic || "Custom Quiz",
            mode: isMockInterview ? "interview" : "standard"
        });
        localStorage.setItem('quizHistory', JSON.stringify(history));
    };

    if (!topics.length && !loading && !quiz) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-center py-20">
                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BrainCircuit className="w-10 h-10 text-gray-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">No Study Plan Found</h1>
                <p className="text-gray-400 mb-8">Create a goal plan to unlock daily quizzes tailored to your tasks.</p>
                <a href="/goals" className="bg-primary-start text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
                    Go to Goal Planner
                </a>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto min-h-screen pb-20">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                    <BrainCircuit className="w-8 h-8 text-primary-start" />
                    {isMockInterview ? "Mock Interview" : "Daily Quiz"}
                </h1>
                <p className="mt-2 text-gray-400">
                    {isMockInterview
                        ? "Prepare for your interviews with conceptual scenario questions."
                        : "Test your knowledge on your current study topics."}
                </p>
            </header>

            {!quiz && !showResults && (
                <div className="bg-card border border-gray-800 rounded-2xl p-8 text-center shadow-xl space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-2">Ready to test yourself?</h2>
                        <p className="text-gray-400">
                            {todaysTopic ? (
                                <>Today's Focus: <span className="text-primary-start font-bold">{todaysTopic}</span></>
                            ) : (
                                "Enter a topic or generate from your study plan."
                            )}
                        </p>
                    </div>

                    <div className="max-w-md mx-auto space-y-4">
                        {/* Mock Interview Toggle */}
                        <button
                            onClick={() => setIsMockInterview(!isMockInterview)}
                            className={clsx(
                                "w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium",
                                isMockInterview
                                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750"
                            )}
                        >
                            <Briefcase className="w-5 h-5" />
                            {isMockInterview ? "Mock Interview Mode ON" : "Switch to Mock Interview Mode"}
                        </button>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder={todaysTopic ? `Custom topic (Default: ${todaysTopic})` : "Enter a topic (e.g., React Hooks)"}
                                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-start"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        generateQuiz(e.target.value.trim() || todaysTopic);
                                    }
                                }}
                                id="quiz-topic-input"
                            />
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    const input = document.getElementById('quiz-topic-input');
                                    const val = input ? input.value.trim() : null;
                                    generateQuiz(val || todaysTopic);
                                }}
                                disabled={loading}
                                className="bg-gradient-to-r from-primary-start to-primary-end px-8 py-3 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all w-full justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        Start {isMockInterview ? "Interview" : "Quiz"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {topics.length > 0 && !todaysTopic && (
                        <p className="text-sm text-gray-500">
                            Or we'll use your current plan: <span className="text-gray-400">{topics.slice(0, 3).join(", ")}...</span>
                        </p>
                    )}

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
            )}

            {quiz && !showResults && (
                <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary-start h-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                        />
                    </div>

                    <div className="bg-card border border-gray-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-medium text-gray-400">
                                Question {currentQuestionIndex + 1} of {quiz.questions.length}
                            </span>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-xs border",
                                isMockInterview ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-gray-800 border-gray-700 text-gray-300"
                            )}>
                                {isMockInterview ? "Interview Scenario" : "MCQ"}
                            </span>
                        </div>

                        <h3 className="text-xl font-semibold text-white mb-8 leading-relaxed">
                            {quiz.questions[currentQuestionIndex].question}
                        </h3>

                        <div className="space-y-3">
                            {quiz.questions[currentQuestionIndex].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    className={clsx(
                                        "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group",
                                        answers[currentQuestionIndex] === option
                                            ? "bg-primary-start/10 border-primary-start text-white"
                                            : "bg-gray-800/30 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                                    )}
                                >
                                    <span>{option}</span>
                                    {answers[currentQuestionIndex] === option && (
                                        <CheckCircle className="w-5 h-5 text-primary-start" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={nextQuestion}
                            disabled={!answers[currentQuestionIndex]}
                            className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {currentQuestionIndex === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
                        </button>
                    </div>
                </div>
            )}

            {showResults && (
                <div className="bg-card border border-gray-800 rounded-2xl p-8 text-center shadow-xl animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                        <Trophy className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {isMockInterview ? "Interview Prep Complete!" : "Quiz Completed!"}
                    </h2>
                    <p className="text-gray-400 mb-8">
                        {score === quiz.questions.length ? "Perfect score! You're ready." : "Good practice. Keep consistent."}
                    </p>

                    <div className="bg-gray-800/50 rounded-2xl p-6 mb-8 max-w-sm mx-auto border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Your Score</p>
                        <div className="text-5xl font-bold text-white mb-2">
                            {score} <span className="text-2xl text-gray-500">/ {quiz.questions.length}</span>
                        </div>
                        <p className="text-sm text-primary-start font-medium">
                            {Math.round((score / quiz.questions.length) * 100)}% Accuracy
                        </p>
                    </div>

                    <button
                        onClick={() => generateQuiz()}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto border border-gray-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Take Another {isMockInterview ? "Interview" : "Quiz"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Quiz;
