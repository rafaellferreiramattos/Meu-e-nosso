
import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';
import { LogIn, UserPlus, ArrowRight, AtSign, HandCoins } from 'lucide-react';

interface AuthPageProps {
    onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    // Initialize email from localStorage if available
    const [email, setEmail] = useState(() => localStorage.getItem('financenter_saved_email') || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const user = authService.login(email, password);
            if (user) {
                // Save email to localStorage on successful login
                localStorage.setItem('financenter_saved_email', email);
                onLogin(user);
            } else {
                setError('Email ou senha incorretos.');
            }
        } else {
            if (!name || !email || !password || !confirmPassword) {
                setError('Por favor, preencha todos os campos.');
                return;
            }
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }

            const result = authService.register(name, email, password);
            if (typeof result === 'string') {
                if (result === 'email_exists') setError('Este email já está cadastrado.');
                else setError('Erro ao cadastrar.');
            } else {
                // Save email to localStorage on successful registration
                localStorage.setItem('financenter_saved_email', email);
                onLogin(result);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 bg-gradient-to-br from-teal-400 to-cyan-600 p-4 rounded-full w-fit shadow-lg shadow-teal-500/20">
                        <HandCoins className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">MEU & NOSSO</h1>
                    <p className="text-gray-400">Organize o seu, realize o nosso.</p>
                </div>

                <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
                    <div className="flex mb-8 bg-slate-900/50 p-1 rounded-lg">
                        <button
                            onClick={() => { setIsLogin(true); setError(''); }}
                            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(''); }}
                            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar Senha</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-teal-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                            {isLogin ? 'Entrar no App' : 'Criar Conta'}
                        </button>
                    </form>
                </div>
                
                <div className="mt-8 text-center space-y-2">
                    <p className="text-gray-500 text-sm">
                        &copy; 2025 MEU & NOSSO. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
