'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';

interface Respuesta {
    texto: string;
    correcta: boolean;
}

interface Pregunta {
    id: number;
    pregunta: string;
    tema: string;
    imagen: string | null;
    respuestas: (Respuesta & { id?: string })[];
    created_at: string;
}

const TEMAS = [
    'Fundación',
    'Campeonatos',
    'Jugadores',
    'Entrenadores',
    'Estadio',
    'Historia',
    'Camisetas',
    'Récords',
];

const EMPTY_PREGUNTA: Partial<Pregunta> = {
    pregunta: '',
    tema: 'Historia',
    imagen: '',
    respuestas: [
        { texto: '', correcta: true, id: '0' },
        { texto: '', correcta: false, id: '1' },
        { texto: '', correcta: false, id: '2' },
    ],
};

export default function TriviaPage() {
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [cargando, setCargando] = useState(true);
    const [expandida, setExpandida] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [subiendoImagen, setSubiendoImagen] = useState(false);

    const [modal, setModal] = useState<{
        abierto: boolean;
        esNueva: boolean;
        datos: Partial<Pregunta>;
        original: number | null;
    }>({ abierto: false, esNueva: true, datos: { ...EMPTY_PREGUNTA }, original: null });

    const [confirmar, setConfirmar] = useState<{
        id: number;
        pregunta: string;
        imagen: string | null;
    } | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await fetch('/api/trivia');
            const data = await res.json();
            setPreguntas(data);
        } catch {
            setError('Error al cargar las preguntas');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const guardarPregunta = async () => {
        setGuardando(true);
        setError('');
        try {
            if (!modal.datos.pregunta?.trim()) {
                setError('La pregunta es requerida');
                setGuardando(false);
                return;
            }

            if (!modal.datos.respuestas || modal.datos.respuestas.length < 2) {
                setError('Se requieren al menos 2 respuestas');
                setGuardando(false);
                return;
            }

            const correctas = modal.datos.respuestas.filter((r) => r.correcta).length;
            if (correctas !== 1) {
                setError('Debe haber exactamente una respuesta correcta');
                setGuardando(false);
                return;
            }

            const url = modal.esNueva ? '/api/trivia' : `/api/trivia/${modal.original}`;
            const method = modal.esNueva ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modal.datos),
            });

            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? 'Error al guardar');
                setGuardando(false);
                return;
            }

            setModal({ abierto: false, esNueva: true, datos: { ...EMPTY_PREGUNTA }, original: null });
            await cargar();
        } catch {
            setError('Error de conexión');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarImagenBlob = useCallback(async (url: string) => {
        const res = await fetch('/api/trivia/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? 'Error al eliminar imagen');
        }
    }, []);

    const eliminarPregunta = async () => {
        if (!confirmar) return;
        setGuardando(true);
        try {
            if (confirmar.imagen) {
                await eliminarImagenBlob(confirmar.imagen);
            }

            const res = await fetch(`/api/trivia/${confirmar.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? 'Error al eliminar');
                setGuardando(false);
                return;
            }
            setConfirmar(null);
            setExpandida(null);
            await cargar();
        } catch {
            setError('Error al eliminar');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-black">Trivia</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de preguntas de trivia</p>
                </div>
                <button
                    onClick={() => setModal({ abierto: true, esNueva: true, datos: { ...EMPTY_PREGUNTA }, original: null })}
                    className="flex items-center gap-2 bg-[#A6192E] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#7E1325] transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    Nueva Pregunta
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex justify-between items-center">
                    {error}
                    <button onClick={() => setError('')} className="ml-3 cursor-pointer">
                        <X size={14} />
                    </button>
                </div>
            )}

            {cargando && <LoadingSpinner label="Cargando preguntas" />}

            {!cargando && preguntas.length === 0 && (
                <div className="text-center py-20 text-gray-400">No hay preguntas. Creá la primera.</div>
            )}

            {!cargando && preguntas.length > 0 && (
                <div className="space-y-3">
                    {preguntas.map((p) => {
                        const abierta = expandida === p.id;
                        return (
                            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="flex items-center gap-4 px-6 py-4">
                                    <button
                                        onClick={() => setExpandida(abierta ? null : p.id)}
                                        className="flex-1 flex items-center gap-4 text-left cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800">{p.pregunta}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                <span className="text-xs bg-[#A6192E]/10 text-[#A6192E] px-2 py-1 rounded-full font-medium">
                                                    {p.tema}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {p.respuestas.length} respuestas
                                                </span>
                                            </div>
                                        </div>
                                        {abierta ? (
                                            <ChevronUp size={18} className="text-gray-400 shrink-0" />
                                        ) : (
                                            <ChevronDown size={18} className="text-gray-400 shrink-0" />
                                        )}
                                    </button>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() =>
                                                setModal({ abierto: true, esNueva: false, datos: { ...p }, original: p.id })
                                            }
                                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setConfirmar({ id: p.id, pregunta: p.pregunta, imagen: p.imagen ?? null })
                                            }
                                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {abierta && (
                                    <div className="border-t border-gray-100 p-6 bg-gray-50">
                                        <div className="space-y-3">
                                            {p.imagen && (
                                                <div className="mb-3">
                                                    <img
                                                        src={p.imagen}
                                                        alt="Imagen de pregunta"
                                                        className="w-full max-w-sm h-40 object-cover rounded-lg"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-1">Respuestas:</p>
                                                <div className="space-y-1.5">
                                                    {p.respuestas.map((r, i) => (
                                                        <div
                                                            key={`${p.id}-resp-${i}`}
                                                            className={`flex items-center gap-2 text-sm p-2 rounded ${
                                                                r.correcta ? 'bg-green-50' : 'bg-white'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                                                                    r.correcta
                                                                        ? 'bg-green-500 border-green-500'
                                                                        : 'border-gray-300'
                                                                }`}
                                                            >
                                                                {r.correcta && (
                                                                    <Check size={12} className="text-white" />
                                                                )}
                                                            </span>
                                                            <span className={r.correcta ? 'font-semibold text-green-700' : 'text-gray-700'}>
                                                                {r.texto}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modal.abierto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modal.esNueva ? 'Nueva Pregunta' : 'Editar Pregunta'}
                            </h2>
                            <button
                                onClick={() => setModal((m) => ({ ...m, abierto: false }))}
                                className="cursor-pointer text-gray-400 hover:text-gray-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="pregunta" className="block text-xs font-semibold text-gray-600 mb-1">Pregunta</label>
                                <textarea
                                    id="pregunta"
                                    value={modal.datos.pregunta ?? ''}
                                    onChange={(e) =>
                                        setModal((m) => ({ ...m, datos: { ...m.datos, pregunta: e.target.value } }))
                                    }
                                    placeholder="Escribí la pregunta"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E] resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="tema" className="block text-xs font-semibold text-gray-600 mb-1">Tema</label>
                                    <select
                                        id="tema"
                                        value={modal.datos.tema ?? 'Historia'}
                                        onChange={(e) =>
                                            setModal((m) => ({ ...m, datos: { ...m.datos, tema: e.target.value } }))
                                        }
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white cursor-pointer"
                                    >
                                        {TEMAS.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="imagen" className="block text-xs font-semibold text-gray-600 mb-1">Imagen</label>
                                    <div className="space-y-2">
                                        {modal.datos.imagen && (
                                            <div className="relative">
                                                <img
                                                    src={modal.datos.imagen}
                                                    alt="Preview"
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <button
                                                    onClick={async () => {
                                                        const imagenActual = modal.datos.imagen;
                                                        if (!imagenActual) return;

                                                        setSubiendoImagen(true);
                                                        try {
                                                            await eliminarImagenBlob(imagenActual);
                                                            setModal((m) => ({ ...m, datos: { ...m.datos, imagen: '' } }));
                                                        } catch {
                                                            setError('No se pudo eliminar la imagen del Blob');
                                                        } finally {
                                                            setSubiendoImagen(false);
                                                        }
                                                    }}
                                                    disabled={subiendoImagen}
                                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded cursor-pointer hover:bg-red-700"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            id="imagen"
                                            type="file"
                                            accept="image/*"
                                            disabled={subiendoImagen}
                                            onChange={async (e) => {
                                                const archivo = e.target.files?.[0];
                                                if (!archivo) return;
                                                
                                                setSubiendoImagen(true);
                                                const formData = new FormData();
                                                formData.append('file', archivo);
                                                
                                                try {
                                                    const res = await fetch('/api/trivia/upload', {
                                                        method: 'POST',
                                                        body: formData,
                                                    });
                                                    
                                                    if (!res.ok) {
                                                        const data = await res.json();
                                                        setError(data.error ?? 'Error al subir imagen');
                                                        setSubiendoImagen(false);
                                                        return;
                                                    }
                                                    
                                                    const { url } = await res.json();
                                                    setModal((m) => ({ ...m, datos: { ...m.datos, imagen: url } }));
                                                } catch {
                                                    setError('Error al subir imagen');
                                                } finally {
                                                    setSubiendoImagen(false);
                                                }
                                            }}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 file:mr-3 file:py-1 file:px-3 file:border-0 file:rounded-md file:text-xs file:font-semibold file:bg-[#A6192E] file:text-white hover:file:bg-[#7E1325] cursor-pointer"
                                        />
                                        {subiendoImagen && <p className="text-xs text-gray-500">Subiendo imagen...</p>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="respuestas-list" className="block text-xs font-semibold text-gray-600 mb-2">Respuestas</label>
                                <div id="respuestas-list"></div>
                                <div className="space-y-2">
                                    {modal.datos.respuestas?.map((r, i) => (
                                        <div key={r.id || i} className="flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={r.correcta}
                                                onChange={(e) => {
                                                    const nuevas = modal.datos.respuestas?.map((rsp, idx) => ({
                                                        ...rsp,
                                                        correcta: idx === i ? e.target.checked : false,
                                                    })) || [];
                                                    setModal((m) => ({ ...m, datos: { ...m.datos, respuestas: nuevas } }));
                                                }}
                                                className="w-4 h-4 accent-[#A6192E] mt-2.5"
                                            />
                                            <input
                                                type="text"
                                                value={r.texto}
                                                onChange={(e) => {
                                                    const nuevas = modal.datos.respuestas?.map((rsp, idx) =>
                                                        idx === i ? { ...rsp, texto: e.target.value } : rsp
                                                    ) || [];
                                                    setModal((m) => ({ ...m, datos: { ...m.datos, respuestas: nuevas } }));
                                                }}
                                                placeholder={`Respuesta ${i + 1}`}
                                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                            />
                                            {(modal.datos.respuestas?.length || 0) > 2 && (
                                                <button
                                                    onClick={() => {
                                                        const nuevas = modal.datos.respuestas?.filter((_, idx) => idx !== i) || [];
                                                        setModal((m) => ({ ...m, datos: { ...m.datos, respuestas: nuevas } }));
                                                    }}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        const nuevas = [...(modal.datos.respuestas || []), { texto: '', correcta: false }];
                                        setModal((m) => ({ ...m, datos: { ...m.datos, respuestas: nuevas } }));
                                    }}
                                    className="mt-2 flex items-center gap-1.5 text-sm text-[#A6192E] font-semibold hover:underline cursor-pointer"
                                >
                                    <Plus size={14} />
                                    Agregar respuesta
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => setModal((m) => ({ ...m, abierto: false }))}
                                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarPregunta}
                                disabled={guardando}
                                className="flex-1 bg-[#A6192E] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#7E1325] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Check size={15} />
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmar eliminación */}
            {confirmar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="font-black text-black text-lg mb-2">Confirmar eliminación</h2>
                        <p className="text-sm text-gray-600 mb-5">¿Eliminás la pregunta: "{confirmar.pregunta}"?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmar(null)}
                                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={eliminarPregunta}
                                disabled={guardando}
                                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                            >
                                {guardando ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
