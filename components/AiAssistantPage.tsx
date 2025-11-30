
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Transaction, Goal, User, Group } from '../types';
import { Send, Sparkles, Bot, User as UserIcon, Loader2, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface AiAssistantPageProps {
    group: Group;
    transactions: Transaction[];
    goals: Goal[];
    members: User[];
    currentUser: User;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    isError?: boolean;
}

const AiAssistantPage: React.FC<AiAssistantPageProps> = ({ group, transactions, goals, members, currentUser }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'intro',
            role: 'model',
            text: `Olá, ${currentUser.name}! Sou seu assistente financeiro inteligente. Posso analisar os gastos do grupo "${group.name}", sugerir onde economizar ou ajudar a planejar suas metas. Como posso ajudar hoje?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [keyStatus, setKeyStatus] = useState<'checking' | 'found' | 'missing'>('checking');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    // Helper simplificado e robusto para Vite/Vercel
    const getApiKey = (): string => {
        let key = '';
        
        // 1. Tenta via Vite (Padrão moderno)
        try {
            // @ts-ignore
            if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
                // @ts-ignore
                key = import.meta.env.VITE_API_KEY;
            }
        } catch (e) { console.log('Vite check failed'); }

        // 2. Se falhar, tenta via variável global (Create React App / Legado)
        if (!key && typeof process !== 'undefined' && process.env) {
            if (process.env.REACT_APP_API_KEY) key = process.env.REACT_APP_API_KEY;
            if (process.env.API_KEY) key = process.env.API_KEY; // Menos comum no browser
        }

        return key;
    };

    // Verifica o status da chave ao carregar
    useEffect(() => {
        const key = getApiKey();
        setKeyStatus(key ? 'found' : 'missing');
    }, []);

    // Prepare context data for the AI
    const getFinancialContext = () => {
        const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);
        
        const categorySummary: Record<string, number> = {};
        transactions.forEach(t => {
            categorySummary[t.category] = (categorySummary[t.category] || 0) + t.amount;
        });

        const memberSpending: Record<string, number> = {};
        transactions.forEach(t => {
            t.payers.forEach(p => {
                const memberName = members.find(m => m.id === p.userId)?.name || 'Desconhecido';
                memberSpending[memberName] = (memberSpending[memberName] || 0) + p.amount;
            });
        });

        const goalsStatus = goals.map(g => `Meta: ${g.name}, Alvo: ${formatCurrency(g.targetAmount)}`).join('; ');

        return JSON.stringify({
            groupName: group.name,
            totalSpent: formatCurrency(totalSpent),
            spendingByCategory: categorySummary,
            spendingByMember: memberSpending,
            goals: goalsStatus,
            transactionCount: transactions.length,
            currentDate: new Date().toLocaleDateString('pt-BR')
        });
    };

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim() && !input.trim()) return;
        
        const apiKey = getApiKey();

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (!apiKey) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "⚠️ CONFIGURAÇÃO INCOMPLETA NA VERCEL\n\nA chave 'VITE_API_KEY' não foi encontrada. O aplicativo não consegue falar com o Google.\n\nSolução:\n1. Vá no painel da Vercel.\n2. Settings > Environment Variables.\n3. Adicione VITE_API_KEY.\n4. Faça REDEPLOY.",
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const context = getFinancialContext();
            
            const systemInstruction = `
                Você é um consultor financeiro pessoal, amigável e especialista em economia doméstica.
                
                CONTEXTO FINANCEIRO (JSON):
                ${context}
                
                REGRAS:
                1. Responda em Português do Brasil.
                2. NÃO USE MARKDOWN (sem **, #, _). Use apenas emojis e quebras de linha.
                3. Seja direto e útil.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: text,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            const modelMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text || "Sem resposta.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, modelMessage]);

        } catch (error: any) {
            console.error("Erro na IA:", error);
            
            let errorDetails = error.toString();
            if (error.message) errorDetails = error.message;

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: `❌ ERRO TÉCNICO:\n${errorDetails}\n\nSe o erro for 403, sua chave tem restrições de domínio incorretas no Google Cloud. Se for 404, o modelo não existe.`,
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeNow = () => {
        handleSendMessage("Faça uma análise rápida das finanças e me dê uma dica.");
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden relative">
            
            {/* Debug/Status Bar - VISÍVEL APENAS SE DER ERRO OU EM DESENVOLVIMENTO */}
            <div className={`text-xs p-2 text-center font-bold flex items-center justify-center gap-2 ${keyStatus === 'found' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                {keyStatus === 'found' ? (
                    <><ShieldCheck className="w-4 h-4" /> API Key Configurada (Pronto para Uso)</>
                ) : (
                    <><ShieldAlert className="w-4 h-4" /> API Key Ausente (Configure VITE_API_KEY na Vercel)</>
                )}
            </div>

            {/* Header Area */}
            <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg text-white shadow-lg shadow-teal-500/20">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assistente IA</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini</p>
                    </div>
                </div>
                <button 
                    onClick={handleAnalyzeNow}
                    disabled={isLoading}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-semibold rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Análise
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-slate-900">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex items-start gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'model' ? (msg.isError ? 'bg-red-100 text-red-500' : 'bg-white dark:bg-slate-800 text-teal-500') : 'bg-teal-600 text-white'}`}>
                            {msg.role === 'model' ? (msg.isError ? <AlertTriangle className="w-5 h-5"/> : <Bot className="w-5 h-5" />) : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div 
                            className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                msg.role === 'user' 
                                    ? 'bg-teal-600 text-white rounded-tr-none' 
                                    : (msg.isError ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-slate-700')
                            }`}
                        >
                            <div className="whitespace-pre-wrap font-sans">
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3 max-w-[75%]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-teal-500 flex items-center justify-center shadow-sm">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Conectando...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="flex items-center gap-2 relative"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte sobre seus gastos..."
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl py-3 pl-4 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiAssistantPage;
