
import React, { useState, useRef } from 'react';
import type { Debt } from '../types';
import { X, Copy, CheckCircle, QrCode, Paperclip, Image as ImageIcon, Trash2 } from 'lucide-react';
import Avatar from './Avatar';

interface PixPaymentModalProps {
    debt: Debt;
    onClose: () => void;
    onConfirmPayment: (receiptUrl?: string) => void;
}

const PixPaymentModal: React.FC<PixPaymentModalProps> = ({ debt, onClose, onConfirmPayment }) => {
    const [copied, setCopied] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const pixKey = debt.to.pixKey || 'Chave Pix não cadastrada';
    const hasKey = !!debt.to.pixKey;

    const handleCopy = () => {
        navigator.clipboard.writeText(pixKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePayment = () => {
        setIsProcessing(true);
        // Simulate network request
        setTimeout(() => {
            setIsProcessing(false);
            onConfirmPayment(receiptUrl || undefined);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 border border-gray-200 dark:border-slate-700 my-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-teal-500"/> Pagamento via Pix
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="text-center mb-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">Pagando para</p>
                    <div className="flex flex-col items-center gap-2">
                        <Avatar user={debt.to} className="w-16 h-16"/>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{debt.to.name}</h3>
                        <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                            R$ {debt.amount.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                </div>

                {/* Simulated QR Code Area */}
                <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 mb-6 flex flex-col items-center justify-center relative overflow-hidden group">
                     {hasKey ? (
                         <>
                            <div className="w-48 h-48 bg-gray-900 dark:bg-white mask-image-qr-code opacity-90 pattern-grid-lg">
                                {/* CSS trick for QR placeholder appearance */}
                                <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-1 p-2">
                                    {[...Array(36)].map((_, i) => (
                                        <div key={i} className={`bg-white dark:bg-slate-900 rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                                    ))}
                                    <div className="absolute top-4 left-4 w-10 h-10 border-4 border-white dark:border-slate-900 bg-gray-900 dark:bg-white"></div>
                                    <div className="absolute top-4 right-4 w-10 h-10 border-4 border-white dark:border-slate-900 bg-gray-900 dark:bg-white"></div>
                                    <div className="absolute bottom-4 left-4 w-10 h-10 border-4 border-white dark:border-slate-900 bg-gray-900 dark:bg-white"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">QR Code gerado automaticamente</p>
                         </>
                     ) : (
                         <div className="text-center py-8">
                             <p className="text-amber-500 font-semibold">Usuário sem chave Pix</p>
                             <p className="text-sm text-gray-500">Peça para {debt.to.name} cadastrar uma chave nas configurações.</p>
                         </div>
                     )}
                </div>

                {hasKey && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chave Pix</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={pixKey} 
                                className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none"
                            />
                            <button 
                                onClick={handleCopy}
                                className="p-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors relative group"
                                title="Copiar"
                            >
                                {copied ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Copy className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Receipt Upload Section */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comprovante (Opcional)</label>
                    
                    {!receiptUrl ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <Paperclip className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Clique para anexar imagem</span>
                        </div>
                    ) : (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 group">
                            <img src={receiptUrl} alt="Comprovante" className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setReceiptUrl(null)}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Comprovante anexado
                            </div>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                    />
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'Processando...' : 'Confirmar Pagamento Realizado'}
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-transparent text-gray-600 dark:text-gray-400 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
                
                <p className="text-xs text-center text-gray-400 mt-4 px-4">
                    Nota: Ao confirmar, uma transação de reembolso será criada automaticamente no grupo para zerar esta dívida.
                </p>
            </div>
        </div>
    );
};

export default PixPaymentModal;