'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, Swords, X, Check, CalendarDays } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';

interface Partido {
    id: number;
    equipo_local: string;
    equipo_visitante: string;
    goles_local: number;
    goles_visitante: number;
    fecha: string;
    competicion: string;
    goleadores_local: string[];
    goleadores_visitante: string[];
    proximo_partido?: boolean;
}

interface TemporadaPartidos {
    anio: number;
    partidos: Partido[];
}

const EMPTY_TEMP: Partial<TemporadaPartidos> = { anio: new Date().getFullYear(), partidos: [] };
const EMPTY_PARTIDO: Partial<Partido> = {
    equipo_local: 'Universitario',
    equipo_visitante: '',
    goles_local: 0,
    goles_visitante: 0,
    fecha: '',
    competicion: '',
    goleadores_local: [],
    goleadores_visitante: [],
    proximo_partido: false,
};

function parseLista(input: string): string[] {
    return input
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function PartidosPage() {
    const [temporadas, setTemporadas] = useState<TemporadaPartidos[]>([]);
    const [cargando, setCargando] = useState(true);
    const [expandida, setExpandida] = useState<number | null>(null);

    const [modalTemp, setModalTemp] = useState<{
        abierto: boolean;
        esNueva: boolean;
        datos: Partial<TemporadaPartidos>;
        original: number | null;
    }>({ abierto: false, esNueva: true, datos: { ...EMPTY_TEMP }, original: null });

    const [modalPartido, setModalPartido] = useState<{
        abierto: boolean;
        anio: number;
        esNuevo: boolean;
        datos: Partial<Partido>;
    }>({ abierto: false, anio: 0, esNuevo: true, datos: { ...EMPTY_PARTIDO } });

    const [confirmar, setConfirmar] = useState<{
        tipo: 'temporada' | 'partido';
        anio: number;
        partidoId?: number;
        mensaje: string;
    } | null>(null);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [goleadoresLocalInput, setGoleadoresLocalInput] = useState('');
    const [goleadoresVisitanteInput, setGoleadoresVisitanteInput] = useState('');

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await fetch('/api/partidos');
            const data = await res.json();
            setTemporadas(data);
        } catch {
            setError('Error al cargar los partidos');
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
            if (!datos.anio) {
                setError('El año es obligatorio');
                return;
            }

            if (esNueva) {
                const res = await fetch('/api/partidos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ anio: datos.anio, partidos: [] }),
                });
                if (!res.ok) {
                    const d = await res.json();
                    setError(d.error ?? 'Error al crear temporada');
                    return;
                }
            } else {
                const temp = temporadas.find((t) => t.anio === original);
                if (!temp) {
                    setError('Temporada no encontrada');
                    return;
                }
                const res = await fetch(`/api/partidos/${original}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partidos: temp.partidos }),
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

    const guardarPartido = async () => {
        setGuardando(true);
        setError('');
        try {
            const { anio, esNuevo, datos } = modalPartido;
            const temp = temporadas.find((t) => t.anio === anio);
            if (!temp) {
                setError('Temporada no encontrada');
                return;
            }

            const payload: Partido = {
                id: Number(datos.id ?? 0),
                equipo_local: String(datos.equipo_local ?? ''),
                equipo_visitante: String(datos.equipo_visitante ?? ''),
                goles_local: Number(datos.goles_local ?? 0),
                goles_visitante: Number(datos.goles_visitante ?? 0),
                fecha: String(datos.fecha ?? ''),
                competicion: String(datos.competicion ?? ''),
                goleadores_local: parseLista(goleadoresLocalInput),
                goleadores_visitante: parseLista(goleadoresVisitanteInput),
                proximo_partido: Boolean(datos.proximo_partido),
            };

            let partidos: Partido[];
            let targetId: number;
            if (esNuevo) {
                const maxId = temp.partidos.reduce((m, p) => Math.max(m, p.id), 0);
                targetId = maxId + 1;
                partidos = [...temp.partidos, { ...payload, id: targetId }];
            } else {
                targetId = payload.id;
                partidos = temp.partidos.map((p) => (p.id === payload.id ? payload : p));
            }

            if (payload.proximo_partido) {
                partidos = partidos.map((p) => ({
                    ...p,
                    proximo_partido: p.id === targetId,
                }));
            }

            const res = await fetch(`/api/partidos/${anio}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partidos }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? 'Error al guardar partido');
                return;
            }

            setModalPartido((m) => ({ ...m, abierto: false }));
            setGoleadoresLocalInput('');
            setGoleadoresVisitanteInput('');
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
                await fetch(`/api/partidos/${confirmar.anio}`, { method: 'DELETE' });
                setExpandida(null);
            } else {
                const temp = temporadas.find((t) => t.anio === confirmar.anio);
                if (!temp) return;
                const partidos = temp.partidos.filter((p) => p.id !== confirmar.partidoId);
                await fetch(`/api/partidos/${confirmar.anio}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partidos }),
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-black">Partidos</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de partidos por temporada</p>
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
                <LoadingSpinner label="Cargando partidos" />
            ) : temporadas.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No hay temporadas. Creá la primera.</div>
            ) : (
                <div className="space-y-3">
                    {temporadas.map((temp) => {
                        const abierta = expandida === temp.anio;
                        return (
                            <div key={temp.anio} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="flex items-center gap-4 px-6 py-4">
                                    <button
                                        onClick={() => setExpandida(abierta ? null : temp.anio)}
                                        className="flex-1 flex items-center gap-4 text-left cursor-pointer"
                                    >
                                        <span className="text-2xl font-black text-black w-16 shrink-0">{temp.anio}</span>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-gray-800">Temporada {temp.anio}</span>
                                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                <Swords size={11} />
                                                {temp.partidos.length} partidos
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
                                                mensaje: `¿Eliminar la temporada ${temp.anio} y sus ${temp.partidos.length} partidos?`,
                                            })}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {abierta && (
                                    <div className="border-t border-gray-100">
                                        {temp.partidos.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-6">Sin partidos. Agregá el primero.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 w-12">#</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Partido</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Comp.</th>
                                                            <th className="px-4 py-3 w-20"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {temp.partidos.map((p) => (
                                                            <tr key={p.id} className="hover:bg-gray-50/50">
                                                                <td className="px-6 py-3 font-mono font-bold text-gray-500">{p.id}</td>
                                                                <td className="px-4 py-3 text-gray-700">{p.fecha || '—'}</td>
                                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                                    {p.equipo_local} {p.goles_local} - {p.goles_visitante} {p.equipo_visitante}
                                                                    {p.proximo_partido && (
                                                                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#A6192E]/10 text-[#A6192E] font-semibold align-middle">
                                                                            Próximo
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-600">{p.competicion || '—'}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex justify-end gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setModalPartido({ abierto: true, anio: temp.anio, esNuevo: false, datos: { ...p } });
                                                                                setGoleadoresLocalInput((p.goleadores_local ?? []).join(', '));
                                                                                setGoleadoresVisitanteInput((p.goleadores_visitante ?? []).join(', '));
                                                                            }}
                                                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                                                        >
                                                                            <Pencil size={13} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setConfirmar({
                                                                                tipo: 'partido',
                                                                                anio: temp.anio,
                                                                                partidoId: p.id,
                                                                                mensaje: `¿Eliminar el partido ${p.equipo_local} vs ${p.equipo_visitante}?`,
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
                                                onClick={() => {
                                                    setModalPartido({ abierto: true, anio: temp.anio, esNuevo: true, datos: { ...EMPTY_PARTIDO } });
                                                    setGoleadoresLocalInput('');
                                                    setGoleadoresVisitanteInput('');
                                                }}
                                                className="flex items-center gap-1.5 text-sm text-[#A6192E] font-semibold hover:underline cursor-pointer"
                                            >
                                                <Plus size={14} />
                                                Agregar Partido
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

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
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Año</label>
                                <input
                                    type="number"
                                    min="1900"
                                    max="2100"
                                    value={modalTemp.datos.anio ?? ''}
                                    onChange={(e) => setModalTemp((m) => ({ ...m, datos: { ...m.datos, anio: parseInt(e.target.value, 10) } }))}
                                    disabled={!modalTemp.esNueva}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E] disabled:bg-gray-50 disabled:text-gray-400"
                                />
                            </div>
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

            {modalPartido.abierto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modalPartido.esNuevo ? 'Agregar Partido' : 'Editar Partido'}
                            </h2>
                            <button onClick={() => setModalPartido((m) => ({ ...m, abierto: false }))} className="cursor-pointer text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo Local</label>
                                <input
                                    type="text"
                                    value={modalPartido.datos.equipo_local ?? ''}
                                    onChange={(e) => setModalPartido((m) => ({ ...m, datos: { ...m.datos, equipo_local: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo Visitante</label>
                                <input
                                    type="text"
                                    value={modalPartido.datos.equipo_visitante ?? ''}
                                    onChange={(e) => setModalPartido((m) => ({ ...m, datos: { ...m.datos, equipo_visitante: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Goles Local</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={modalPartido.datos.goles_local ?? 0}
                                    onChange={(e) => setModalPartido((m) => ({ ...m, datos: { ...m.datos, goles_local: parseInt(e.target.value || '0', 10) } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Goles Visitante</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={modalPartido.datos.goles_visitante ?? 0}
                                    onChange={(e) => setModalPartido((m) => ({ ...m, datos: { ...m.datos, goles_visitante: parseInt(e.target.value || '0', 10) } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha del Partido</label>
                                <input
                                    type="date"
                                    value={modalPartido.datos.fecha ?? ''}
                                    onChange={(e) => setModalPartido((m) => ({ ...m, datos: { ...m.datos, fecha: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Competición</label>
                                <input
                                    type="text"
                                    value={modalPartido.datos.competicion ?? ''}
                                    onChange={(e) => setModalPartido((m) => ({ ...m, datos: { ...m.datos, competicion: e.target.value } }))}
                                    placeholder="Liga 1, Copa Libertadores, ..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Goleadores Local (separados por coma)</label>
                                <input
                                    type="text"
                                    value={goleadoresLocalInput}
                                    onChange={(e) => setGoleadoresLocalInput(e.target.value)}
                                    placeholder="Polo x2, Flores"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Goleadores Visitante (separados por coma)</label>
                                <input
                                    type="text"
                                    value={goleadoresVisitanteInput}
                                    onChange={(e) => setGoleadoresVisitanteInput(e.target.value)}
                                    placeholder="Apellido x2"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(modalPartido.datos.proximo_partido)}
                                        onChange={(e) => setModalPartido((m) => ({
                                            ...m,
                                            datos: { ...m.datos, proximo_partido: e.target.checked },
                                        }))}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Marcar como próximo partido</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-500 flex items-center gap-1.5">
                            <CalendarDays size={13} />
                            Tip: podés dejar goleadores vacío si el partido quedó 0-0.
                        </div>

                        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => {
                                    setModalPartido((m) => ({ ...m, abierto: false }));
                                    setGoleadoresLocalInput('');
                                    setGoleadoresVisitanteInput('');
                                }}
                                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarPartido}
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
