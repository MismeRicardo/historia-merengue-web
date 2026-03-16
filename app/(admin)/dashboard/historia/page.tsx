'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';

type EventoHistoria = {
    id: number;
    anio: number;
    titulo: string;
    descripcion: string;
    icono: string;
};

type FormData = {
    anio: number;
    titulo: string;
    descripcion: string;
    icono: string;
};

const EMPTY_FORM: FormData = {
    anio: new Date().getFullYear(),
    titulo: '',
    descripcion: '',
    icono: 'star',
};

const ICONOS = ['star', 'trophy', 'people', 'stadium'];

export default function HistoriaPage() {
    const [eventos, setEventos] = useState<EventoHistoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const [modal, setModal] = useState<{
        abierto: boolean;
        esNuevo: boolean;
        id: number | null;
        data: FormData;
    }>({
        abierto: false,
        esNuevo: true,
        id: null,
        data: { ...EMPTY_FORM },
    });

    const [confirmDelete, setConfirmDelete] = useState<{ id: number; titulo: string } | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const res = await fetch('/api/historia');
            if (!res.ok) throw new Error('Error al cargar historia');
            const data = (await res.json()) as EventoHistoria[];
            setEventos(data);
        } catch {
            setError('No se pudo cargar la historia');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const abrirNuevo = () => {
        setModal({ abierto: true, esNuevo: true, id: null, data: { ...EMPTY_FORM } });
    };

    const abrirEditar = (ev: EventoHistoria) => {
        setModal({
            abierto: true,
            esNuevo: false,
            id: ev.id,
            data: {
                anio: ev.anio,
                titulo: ev.titulo,
                descripcion: ev.descripcion,
                icono: ev.icono || 'star',
            },
        });
    };

    const guardar = async () => {
        const payload = {
            anio: Number(modal.data.anio),
            titulo: modal.data.titulo.trim(),
            descripcion: modal.data.descripcion.trim(),
            icono: modal.data.icono.trim() || 'star',
        };

        if (!payload.anio || !payload.titulo) {
            setError('Año y título son obligatorios');
            return;
        }

        setGuardando(true);
        setError('');

        try {
            const endpoint = modal.esNuevo ? '/api/historia' : `/api/historia/${modal.id}`;
            const method = modal.esNuevo ? 'POST' : 'PUT';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? 'No se pudo guardar');
                return;
            }

            setModal((m) => ({ ...m, abierto: false }));
            await cargar();
        } catch {
            setError('Error de conexion');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async () => {
        if (!confirmDelete) return;

        setGuardando(true);
        setError('');
        try {
            const res = await fetch(`/api/historia/${confirmDelete.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? 'No se pudo eliminar');
                return;
            }
            setConfirmDelete(null);
            await cargar();
        } catch {
            setError('Error de conexion');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-black">Historia del Club</h1>
                    <p className="text-sm text-gray-500 mt-1">Crear y editar eventos históricos</p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="flex items-center gap-2 bg-[#A6192E] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#7E1325] transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    Nuevo Evento
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

            {cargando ? (
                <LoadingSpinner label="Cargando historia" />
            ) : eventos.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No hay eventos históricos registrados.</div>
            ) : (
                <div className="space-y-3">
                    {eventos.map((ev) => (
                        <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs px-2 py-1 rounded-full bg-[#A6192E]/10 text-[#A6192E] font-semibold">
                                            {ev.anio}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                            {ev.icono || 'star'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-black mt-2">{ev.titulo}</h3>
                                    {!!ev.descripcion && (
                                        <p className="text-sm text-gray-500 mt-1">{ev.descripcion}</p>
                                    )}
                                </div>

                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => abrirEditar(ev)}
                                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete({ id: ev.id, titulo: ev.titulo })}
                                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal.abierto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modal.esNuevo ? 'Nuevo Evento' : 'Editar Evento'}
                            </h2>
                            <button
                                onClick={() => setModal((m) => ({ ...m, abierto: false }))}
                                className="cursor-pointer text-gray-400 hover:text-gray-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Año</label>
                                <input
                                    type="number"
                                    value={modal.data.anio}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, anio: Number(e.target.value || 0) } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Icono</label>
                                <select
                                    value={modal.data.icono}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, icono: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                >
                                    {ICONOS.map((icono) => (
                                        <option key={icono} value={icono}>
                                            {icono}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={modal.data.titulo}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, titulo: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Ej: Fundación del Club"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                                <textarea
                                    value={modal.data.descripcion}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, descripcion: e.target.value } }))}
                                    rows={4}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none resize-y"
                                    placeholder="Describe el hito histórico"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setModal((m) => ({ ...m, abierto: false }))}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardar}
                                disabled={guardando}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#A6192E] text-white hover:bg-[#7E1325] disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                            >
                                <Check size={14} />
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-black text-lg mb-2">Eliminar evento</h3>
                        <p className="text-sm text-gray-600">
                            ¿Seguro que deseas eliminar <span className="font-semibold">{confirmDelete.titulo}</span>?
                        </p>
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={eliminar}
                                disabled={guardando}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
