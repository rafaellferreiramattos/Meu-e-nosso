
import { createClient } from '@supabase/supabase-js';

// Função robusta para pegar chaves em qualquer ambiente (Vite, Create React App, etc)
const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_KEY') || getEnv('REACT_APP_SUPABASE_KEY');

// Só cria o cliente se as chaves existirem
export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;
