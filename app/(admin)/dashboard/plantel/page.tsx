'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, Trophy, Users, X, Check } from 'lucide-react';

interface Jugador {
    id: number;
    nombre: string;
    posicion: string;
    numero: number;
    nacionalidad: string;
}

interface Temporada {
    anio: number;
    dt: string;
    jugadores: Jugador[];
    goleador: string;
    campeon: boolean;
}

const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Extremo', 'Delantero'];

const POS_COLOR: Record<string, string> = {
    Portero: 'bg-yellow-100 text-yellow-700',
    Defensa: 'bg-blue-100 text-blue-700',
    Mediocampista: 'bg-green-100 text-green-700',
    Extremo: 'bg-purple-100 text-purple-700',
    Delantero: 'bg-red-100 text-red-700',
};

const EMPTY_TEMP: Partial<Temporada> = { anio: new Date().getFullYear(), dt: '', goleador: '', campeon: false };
const EMPTY_JUG: Partial<Jugador> = { nombre: '', posicion: 'Delantero', numero: 1, nacionalidad: 'Perú' };

export default function PlantelPage() {
    const [temporadas, setTemporadas] = useState<Temporada[]>([]);
    const [cargando, setCargando] = useState(true);
    const [expandida, setExpandida] = useState<number | null>(null);

    const [modalTemp, setModalTemp] = useState<{
        abierto: boolean;
        esNueva: boolean;
        datos: Partial<Temporada>;
        original: number | null;
    }>({ abierto: false, esNueva: true, datos: { ...EMPTY_TEMP }, original: null });

    const [modalJug, setModalJug] = useState<{
        abierto: boolean;
        anio: number;
        esNuevo: boolean;
        datos: Partial<Jugador>;
    }>({ abierto: false, anio: 0, esNuevo: true, datos: { ...EMPTY_JUG } });

    const [confirmar, setConfirmar] = useState<{
        tipo: 'temporada' | 'jugador';
        anio: number;
        jugadorId?: number;
        mensaje: string;
    } | null>(null);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await fetch('/api/plantel');
            const data = await res.json();
            setTemporadas(data);
        } catch {
            setError('Error al cargar el plantel');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const guardarTemporada = async () => {
        setGuardando(true);
        setError('');
        try {
            const { esNueva, datos, original } = modalTemp;
            if (esNueva) {
                const res = await fetch('/api/plantel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos),
                });
                if (!res.ok) {
                    const d = await res.json();
                    setError(d.error ?? 'Error al crear temporada');
                    return;
                }
            } else {
                const res = await fetch(`/api/plantel/${original}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos),
                });
                if (!res.ok) {
                    const d = await res.json();
                    setError(d.error ?? 'Error al actualizar temporada');
                    return;
                }
            }
            setModalTemp((m) => ({ ...m, abierto: false }));
            await cargar();
        } catch {
            setError('Error de conexión');
        } finally {
            setGuardando(false);
        }
    };

    const guardarJugador = async () => {
        setGuardando(true);
        setError('');
        try {
            const { anio, esNuevo, datos } = modalJug;
            const temp = temporadas.find((t) => t.anio === anio);
            if (!temp) return;

            let jugadores: Jugador[];
            if (esNuevo) {
                const maxId = temp.jugadores.reduce((m, j) => Math.max(m, j.id), 0);
                jugadores = [...temp.jugadores, { ...datos, id: maxId + 1 } as Jugador];
            } else {
                jugadores = temp.jugadores.map((j) =>
                    j.id === datos.id ? ({ ...j, ...datos } as Jugador) : j
                );
            }

            const res = await fetch(`/api/plantel/${anio}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jugadores }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? 'Error al guardar jugador');
                return;
            }
            setModalJug((m) => ({ ...m, abierto: false }));
            await cargar();
        } catch {
            setError('Error de conexión');
        } finally {
            setGuardando(false);
        }
    };

    const ejecutarBorrado = async () => {
        if (!confirmar) return;
        setGuardando(true);
        try {
            if (confirmar.tipo === 'temporada') {
                await fetch(`/api/plantel/${confirmar.anio}`, { method: 'DELETE' });
                setExpandida(null);
            } else {
                const temp = temporadas.find((t) => t.anio === confirmar.anio);
                if (!temp) return;
                const jugadores = temp.jugadores.filter((j) => j.id !== confirmar.jugadorId);
                await fetch(`/api/plantel/${confirmar.anio}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jugadores }),
                });
            }
            setConfirmar(null);
            await cargar();
        } catch {
            setError('Error al eliminar');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-black">Plantel</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de jugadores por temporada</p>
                </div>
                <button
                    onClick={() => setModalTemp({ abierto: true, esNueva: true, datos: { ...EMPTY_TEMP }, original: null })}
                    className="flex items-center gap-2 bg-[#A6192E] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#7E1325] transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    Nueva Temporada
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex justify-between items-center">
                    {error}
                    <button onClick={() => setError('')} className="ml-3 cursor-pointer"><X size={14} /></button>
                </div>
            )}

            {cargando ? (
                <div className="text-center py-20 text-gray-400">Cargando...</div>
            ) : temporadas.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    No hay temporadas. Creá la primera.
                </div>
            ) : (
                <div className="space-y-3">
                    {temporadas.map((temp) => {
                        const abierta = expandida === temp.anio;
                        return (
                            <div key={temp.anio} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                {/* Fila de temporada */}
                                <div className="flex items-center gap-4 px-6 py-4">
                                    <button
                                        onClick={() => setExpandida(abierta ? null : temp.anio)}
                                        className="flex-1 flex items-center gap-4 text-left cursor-pointer"
                                    >
                                        <span className="text-2xl font-black text-black w-16 shrink-0">{temp.anio}</span>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-gray-800">{temp.dt || '—'}</span>
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Users size={11} />
                                                    {temp.jugadores.length} jugadores
                                                </span>
                                                {temp.goleador && (
                                                    <span className="text-xs text-gray-400">· Gol: {temp.goleador}</span>
                                                )}
                                                {temp.campeon && (
                                                    <span className="flex items-center gap-1 bg-[#A6192E] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                        <Trophy size={10} />
                                                        Campeón
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {abierta
                                            ? <ChevronUp size={18} className="text-gray-400 shrink-0" />
                                            : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                                    </button>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => setModalTemp({ abierto: true, esNueva: false, datos: { ...temp }, original: temp.anio })}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => setConfirmar({
                                                tipo: 'temporada',
                                                anio: temp.anio,
                                                mensaje: `¿Eliminar la temporada ${temp.anio} y sus ${temp.jugadores.length} jugadores?`,
                                            })}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tabla de jugadores */}
                                {abierta && (
                                    <div className="border-t border-gray-100">
                                        {temp.jugadores.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-6">
                                                Sin jugadores. Agregá el primero.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 w-12">#</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nombre</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Posición</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nacionalidad</th>
                                                            <th className="px-4 py-3 w-20"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {[...temp.jugadores]
                                                            .sort((a, b) => a.numero - b.numero)
                                                            .map((jug) => (
                                                                <tr key={jug.id} className="hover:bg-gray-50/50">
                                                                    <td className="px-6 py-3 font-mono font-bold text-gray-500">{jug.numero}</td>
                                                                    <td className="px-4 py-3 font-medium text-gray-800">{jug.nombre}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${POS_COLOR[jug.posicion] ?? 'bg-gray-100 text-gray-700'}`}>
                                                                            {jug.posicion}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-gray-600">{jug.nacionalidad}</td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex justify-end gap-1">
                                                                            <button
                                                                                onClick={() => setModalJug({ abierto: true, anio: temp.anio, esNuevo: false, datos: { ...jug } })}
                                                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                                                            >
                                                                                <Pencil size={13} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setConfirmar({
                                                                                    tipo: 'jugador',
                                                                                    anio: temp.anio,
                                                                                    jugadorId: jug.id,
                                                                                    mensaje: `¿Eliminar a ${jug.nombre}?`,
                                                                                })}
                                                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        <div className="px-6 py-3 border-t border-gray-50">
                                            <button
                                                onClick={() => setModalJug({ abierto: true, anio: temp.anio, esNuevo: true, datos: { ...EMPTY_JUG } })}
                                                className="flex items-center gap-1.5 text-sm text-[#A6192E] font-semibold hover:underline cursor-pointer"
                                            >
                                                <Plus size={14} />
                                                Agregar Jugador
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal Temporada ── */}
            {modalTemp.abierto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modalTemp.esNueva ? 'Nueva Temporada' : `Editar Temporada ${modalTemp.original}`}
                            </h2>
                            <button onClick={() => setModalTemp((m) => ({ ...m, abierto: false }))} className="cursor-pointer text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Año</label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max="2100"
                                        value={modalTemp.datos.anio ?? ''}
                                        onChange={(e) => setModalTemp((m) => ({ ...m, datos: { ...m.datos, anio: parseInt(e.target.value) } }))}
                                        disabled={!modalTemp.esNueva}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E] disabled:bg-gray-50 disabled:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Director Técnico</label>
                                    <input
                                        type="text"
                                        value={modalTemp.datos.dt ?? ''}
                                        onChange={(e) => setModalTemp((m) => ({ ...m, datos: { ...m.datos, dt: e.target.value } }))}
                                        placeholder="Nombre del DT"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Goleador de la temporada</label>
                                <input
                                    type="text"
                                    value={modalTemp.datos.goleador ?? ''}
                                    onChange={(e) => setModalTemp((m) => ({ ...m, datos: { ...m.datos, goleador: e.target.value } }))}
                                    placeholder="Jugador más goleador"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={modalTemp.datos.campeon ?? false}
                                    onChange={(e) => setModalTemp((m) => ({ ...m, datos: { ...m.datos, campeon: e.target.checked } }))}
                                    className="w-4 h-4 accent-[#A6192E]"
                                />
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                    <Trophy size={14} className="text-[#A6192E]" />
                                    Campeón Nacional
                                </span>
                            </label>
                        </div>
                        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => setModalTemp((m) => ({ ...m, abierto: false }))}
                                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarTemporada}
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

            {/* ── Modal Jugador ── */}
            {modalJug.abierto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modalJug.esNuevo ? 'Agregar Jugador' : 'Editar Jugador'}
                            </h2>
                            <button onClick={() => setModalJug((m) => ({ ...m, abierto: false }))} className="cursor-pointer text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={modalJug.datos.nombre ?? ''}
                                    onChange={(e) => setModalJug((m) => ({ ...m, datos: { ...m.datos, nombre: e.target.value } }))}
                                    placeholder="Nombre del jugador"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Número</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={modalJug.datos.numero ?? ''}
                                        onChange={(e) => setModalJug((m) => ({ ...m, datos: { ...m.datos, numero: parseInt(e.target.value) } }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Posición</label>
                                    <select
                                        value={modalJug.datos.posicion ?? 'Delantero'}
                                        onChange={(e) => setModalJug((m) => ({ ...m, datos: { ...m.datos, posicion: e.target.value } }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white cursor-pointer"
                                    >
                                        {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nacionalidad</label>
                                <input
                                    type="text"
                                    value={modalJug.datos.nacionalidad ?? ''}
                                    onChange={(e) => setModalJug((m) => ({ ...m, datos: { ...m.datos, nacionalidad: e.target.value } }))}
                                    placeholder="País"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => setModalJug((m) => ({ ...m, abierto: false }))}
                                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarJugador}
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

            {/* ── Confirmar eliminación ── */}
            {confirmar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="font-black text-black text-lg mb-2">Confirmar eliminación</h2>
                        <p className="text-sm text-gray-600 mb-5">{confirmar.mensaje}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmar(null)}
                                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarBorrado}
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
