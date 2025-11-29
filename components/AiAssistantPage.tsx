
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Transaction, Goal, User, Group } from '../types';
import { Send, Sparkles, Bot, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';

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
        
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const context = getFinancialContext();
            
            const systemInstruction = `
                Você é um consultor financeiro pessoal, amigável e especialista em economia doméstica para grupos e casais.
                
                CONTEXTO FINANCEIRO ATUAL (JSON):
                ${context}
                
                DIRETRIZES ESTRITAS DE FORMATAÇÃO (IMPORTANTE):
                1. Responda sempre em Português do Brasil.
                2. **NÃO USE SÍMBOLOS DE MARKDOWN**. Proibido usar asteriscos (** ou *), hashtags (#) ou sublinhados (_).
                3. Para organizar o texto, use APENAS quebras de linha e emojis.
                4. Para destacar títulos ou seções importantes, use LETRAS MAIÚSCULAS.
                5. Para listas, use um emoji (ex: 🔹, 👉, 💡) no início da linha, em vez de asteriscos ou traços.
                6. Deixe espaço em branco (linhas vazias) entre os parágrafos para facilitar a leitura.
                7. Seja conciso, direto e organizado.
                
                OBJETIVO:
                Se o usuário pedir uma análise geral, foque nas maiores categorias de gasto e dê 3 dicas práticas.
                Mantenha um tom motivador e positivo.
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
                text: response.text || "Desculpe, não consegui processar sua solicitação no momento.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Erro na IA:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "Desculpe, tive um problema ao conectar com minha inteligência. Tente novamente mais tarde.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeNow = () => {
        handleSendMessage("Por favor, faça uma análise completa das nossas finanças atuais. Identifique onde estamos gastando mais e me dê 3 sugestões concretas para economizarmos este mês.");
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden relative">
            
            {/* Header Area */}
            <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg text-white shadow-lg shadow-teal-500/20">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assistente IA</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini 2.5 Flash</p>
                    </div>
                </div>
                <button 
                    onClick={handleAnalyzeNow}
                    disabled={isLoading}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-semibold rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Análise Completa
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-slate-900">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex items-start gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'model' ? 'bg-white dark:bg-slate-800 text-teal-500' : 'bg-teal-600 text-white'}`}>
                            {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div 
                            className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                msg.role === 'user' 
                                    ? 'bg-teal-600 text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-slate-700'
                            }`}
                        >
                            <div className="whitespace-pre-wrap font-sans">
                                {msg.text}
                            </div>
                            <span className={`text-[10px] mt-2 block opacity-70 ${msg.role === 'user' ? 'text-teal-100' : 'text-gray-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
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
                                Analisando finanças...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                {messages.length === 1 && (
                     <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        <button onClick={() => handleSendMessage("Como podemos economizar em mercado?")} className="whitespace-nowrap px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full text-xs text-gray-700 dark:text-gray-300 transition-colors">
                            📉 Economizar no mercado
                        </button>
                        <button onClick={() => handleSendMessage("Qual é a situação das nossas dívidas?")} className="whitespace-nowrap px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full text-xs text-gray-700 dark:text-gray-300 transition-colors">
                            💰 Situação das dívidas
                        </button>
                        <button onClick={() => handleSendMessage("Crie uma meta realista de viagem.")} className="whitespace-nowrap px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full text-xs text-gray-700 dark:text-gray-300 transition-colors">
                            ✈️ Planejar viagem
                        </button>
                    </div>
                )}
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
                        placeholder="Pergunte sobre seus gastos ou peça dicas..."
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
