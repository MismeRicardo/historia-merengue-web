'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                router.push('/dashboard');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error ?? 'Error al iniciar sesión');
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#A6192E] flex items-center justify-center p-4">
            <div className="bg-[#FFFEF4] rounded-2xl shadow-2xl w-full max-w-md p-8">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div
                        className="w-20 h-20 rounded-full bg-[#A6192E] flex items-center justify-center mb-4"
                        style={{ border: '4px solid #C9A84C' }}
                    >
                        <span className="text-5xl text-[#FFFEF4]" style={{ fontWeight: 900, lineHeight: 1 }}>
                            U
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-black">Historia Merengue</h1>
                    <p className="text-sm text-gray-500 mt-1">Panel de Administración</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                            placeholder="admin"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#A6192E] text-[#FFFEF4] font-bold py-3 rounded-xl hover:bg-[#7E1325] transition-colors disabled:opacity-60 mt-2"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar al Panel'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Club Universitario de Deportes · {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
