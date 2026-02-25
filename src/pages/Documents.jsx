import React, { useState, useRef } from 'react';
import { generateJSON, generateContent } from '../services/geminiService';
import { FileText, Upload, Send, Loader2, Bot, User, Trash2, AlertCircle, Sparkles, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import clsx from 'clsx';

// Configure PDF.js worker for production readiness
// We use the CDN version for worker to ensure it works across all deployment environments without complex bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const Documents = () => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatHistory, setChatHistory] = useState([]); // [{ role: 'user' | 'ai', content: '' }]
    const [question, setQuestion] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [planInstruction, setPlanInstruction] = useState('');
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    // Scroll to bottom of chat
    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isTyping]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsProcessing(true);
        setError(null);
        setExtractedText('');
        setChatHistory([]);
        setGeneratedPlan(null);

        try {
            let text = '';
            if (selectedFile.type === 'application/pdf') {
                text = await extractTextFromPDF(selectedFile);
            } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                text = await extractTextFromDOCX(selectedFile);
            } else if (selectedFile.type === 'text/plain') {
                text = await extractTextFromTXT(selectedFile);
            } else if (selectedFile.type.startsWith('image/')) {
                text = "Image uploaded. You can now ask questions about it.";
            } else {
                throw new Error("Unsupported file type.");
            }
            setExtractedText(text || "No text extracted.");
        } catch (err) {
            console.error("Processing Error:", err);
            setError("Failed to process file: " + err.message);
            setFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const extractTextFromPDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
    };

    const extractTextFromDOCX = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    const extractTextFromTXT = async (file) => {
        return await file.text();
    };

    const handleSend = async () => {
        if (!question.trim() || !file || isTyping) return;

        const userMsg = question;
        setQuestion('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const context = `Document Content (Context): ${extractedText.slice(0, 10000)}`;
            const prompt = `${context}\n\nUser Question: ${userMsg}\n\nAnswer the question based on the document content provided above.`;
            const answer = await generateContent(prompt);
            setChatHistory(prev => [...prev, { role: 'ai', content: answer }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error: " + err.message }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleGeneratePlan = async () => {
        if (!file || isGeneratingPlan) return;

        setIsGeneratingPlan(true);
        setError(null);

        try {
            const context = `Document Content: ${extractedText.slice(0, 15000)}`;

            const prompt = `
                You are a learning architect. 
                Create a high-quality, structured 4-week study plan based on this content.
                
                ${planInstruction ? `Focus specifically on: ${planInstruction}` : ''}
                
                Content Base: ${context}

                Return ONLY a JSON object with this exact structure:
                {
                  "title": "Clear Course Title",
                  "description": "Concise summary of the learning journey",
                  "weeks": [
                    {
                      "weekNumber": 1,
                      "theme": "Core Topic of the Week",
                      "days": [
                        { "day": "Day 1", "focus": "Daily objective", "tasks": ["Task 1", "Task 2"] }
                      ]
                    }
                  ]
                }
                Ensure all 4 weeks are populated with at least 5 days each.
            `;

            const plan = await generateJSON(prompt);
            setGeneratedPlan(plan);
            setChatHistory(prev => [...prev, { role: 'ai', content: `**Study Plan Generated!**\n\nTitle: ${plan.title}\nDescription: ${plan.description}\n\nYou can now export this to your Goal Planner.` }]);
        } catch (err) {
            console.error("Plan Generation Error:", err);
            setError("Failed to generate plan: " + err.message);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const exportToGoals = async () => {
        if (!generatedPlan) return;

        try {
            if (user) {
                const { error: dbError } = await supabase
                    .from('study_plans')
                    .insert([{
                        user_id: user.id,
                        title: generatedPlan.title,
                        description: generatedPlan.description,
                        weeks: generatedPlan.weeks
                    }]);

                if (dbError) throw dbError;
            }

            const existingPlans = JSON.parse(localStorage.getItem('studyGoalPlans') || '[]');
            const newPlan = {
                ...generatedPlan,
                id: Date.now(),
                createdAt: new Date().toISOString()
            };

            const updatedPlans = [newPlan, ...existingPlans].slice(0, 2);
            localStorage.setItem('studyGoalPlans', JSON.stringify(updatedPlans));

            window.dispatchEvent(new CustomEvent('plans-updated', { detail: updatedPlans }));

            setChatHistory(prev => [...prev, { role: 'ai', content: "Success! The study plan has been exported to your Goal Planner." }]);
        } catch (err) {
            setError("Failed to export plan: " + err.message);
        }
    };

    const clearDocument = () => {
        setFile(null);
        setExtractedText('');
        setChatHistory([]);
        setGeneratedPlan(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary-start" />
                    Document Q&A
                </h1>
                <p className="mt-2 text-gray-400">Upload your study materials (PDF, TXT, DOCX, Images) for interactive learning and automated study planning.</p>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {!file ? (
                        <div className="flex flex-col gap-6">
                            <div
                                className="border-2 border-dashed border-gray-700 rounded-2xl bg-card/50 flex flex-col items-center justify-center p-8 text-center hover:border-primary-start/50 hover:bg-card/80 transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.docx,.txt,image/*"
                                    className="hidden"
                                />
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-start" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Upload Files</h3>
                                <p className="text-sm text-gray-400">PDF, DOCX, TXT or Images</p>
                            </div>

                            {isProcessing && (
                                <div className="mt-2 flex items-center gap-2 text-primary-start justify-center animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm font-medium">Extracting text...</span>
                                </div>
                            )}
                            {error && (
                                <div className="mt-2 flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-2 rounded-lg text-xs justify-center text-center border border-red-500/20">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-card border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-0">
                            <div className="flex items-start justify-between mb-4 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-start/20 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-primary-start" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-semibold text-white truncate max-w-[180px]" title={file.name}>
                                            {file.name}
                                        </h3>
                                        <p className="text-xs text-gray-400">
                                            {((file.size || 0) / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearDocument}
                                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-gray-800/30 rounded-xl p-4 flex-1 overflow-y-auto custom-scrollbar border border-gray-700/50">
                                {file.type?.startsWith('image/') ? (
                                    <div className="space-y-2">
                                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-auto rounded-lg border border-gray-700" />
                                        <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest font-bold">Image Analysis Ready</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {extractedText.slice(0, 1000)}...
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-800 space-y-3 flex-shrink-0">
                                {!generatedPlan ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={planInstruction}
                                            onChange={(e) => setPlanInstruction(e.target.value)}
                                            placeholder="Optional: What should this plan focus on?"
                                            className="w-full bg-background border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-primary-start outline-none resize-none"
                                            rows={2}
                                        />
                                        <button
                                            onClick={handleGeneratePlan}
                                            disabled={isGeneratingPlan || isProcessing}
                                            className="w-full bg-gradient-to-r from-primary-start to-primary-end text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary-start/10"
                                        >
                                            {isGeneratingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                            Generate Study Plan
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={exportToGoals}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
                                    >
                                        <Save className="w-5 h-5" />
                                        Export to Goal Planner
                                    </button>
                                )}
                                <p className="text-[10px] text-gray-500 text-center italic">
                                    AI will create a structured 4-week roadmap based on this content.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-card border border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 opacity-50">
                                <Bot className="w-16 h-16 mb-4" />
                                <p>Upload content to start chatting.</p>
                            </div>
                        )}
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={clsx("flex gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                {msg.role === 'ai' && (
                                    <div className="w-8 h-8 rounded-full bg-primary-start flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <div className={clsx(
                                    "max-w-[80%] rounded-2xl px-5 py-3 text-sm",
                                    msg.role === 'user' ? "bg-primary-start text-white rounded-tr-none" : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
                                )}>
                                    <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="w-5 h-5 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-4 justify-start">
                                <div className="w-8 h-8 rounded-full bg-primary-start flex items-center justify-center mt-1"><Bot className="w-5 h-5 text-white" /></div>
                                <div className="bg-gray-800 rounded-2xl p-3 border border-gray-700">...</div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t border-gray-800 bg-black/20 flex-shrink-0">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={file ? "Ask something..." : "Upload content first..."}
                                disabled={!file || isProcessing || isTyping}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-start transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!file || !question.trim() || isProcessing || isTyping}
                                className="bg-primary-start text-white p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Documents;
