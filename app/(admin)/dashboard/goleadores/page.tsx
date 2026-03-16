'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Medal, Pencil, Plus, Star, Trash2, UserRound, X } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';

type Goleador = {
    id: number;
    nombre: string;
    nombreCompleto: string;
    goles: number;
    temporadas: string;
    partidos: number;
    nacionalidad: string;
    apodo: string | null;
    activo: boolean;
};

type FormData = {
    nombre: string;
    nombreCompleto: string;
    goles: number;
    temporadas: string;
    partidos: number;
    nacionalidad: string;
    apodo: string;
    activo: boolean;
};

const EMPTY_FORM: FormData = {
    nombre: '',
    nombreCompleto: '',
    goles: 0,
    temporadas: '',
    partidos: 0,
    nacionalidad: 'Peru',
    apodo: '',
    activo: false,
};

export default function GoleadoresPage() {
    const [goleadores, setGoleadores] = useState<Goleador[]>([]);
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

    const [confirmDelete, setConfirmDelete] = useState<{ id: number; nombre: string } | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const res = await fetch('/api/goleadores');
            if (!res.ok) throw new Error('Error al cargar goleadores');
            const data = (await res.json()) as Goleador[];
            setGoleadores(data);
        } catch {
            setError('No se pudieron cargar los goleadores');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const ranking = useMemo(
        () => [...goleadores].sort((a, b) => b.goles - a.goles || a.partidos - b.partidos || a.id - b.id),
        [goleadores]
    );

    const maximoGoleador = ranking[0] ?? null;
    const goleadoresActivos = ranking.filter((item) => item.activo).length;

    const abrirNuevo = () => {
        setModal({ abierto: true, esNuevo: true, id: null, data: { ...EMPTY_FORM } });
    };

    const abrirEditar = (goleador: Goleador) => {
        setModal({
            abierto: true,
            esNuevo: false,
            id: goleador.id,
            data: {
                nombre: goleador.nombre,
                nombreCompleto: goleador.nombreCompleto,
                goles: goleador.goles,
                temporadas: goleador.temporadas,
                partidos: goleador.partidos,
                nacionalidad: goleador.nacionalidad,
                apodo: goleador.apodo ?? '',
                activo: goleador.activo,
            },
        });
    };

    const guardar = async () => {
        const payload = {
            nombre: modal.data.nombre.trim(),
            nombreCompleto: modal.data.nombreCompleto.trim(),
            goles: Math.max(0, Number(modal.data.goles || 0)),
            temporadas: modal.data.temporadas.trim(),
            partidos: Math.max(0, Number(modal.data.partidos || 0)),
            nacionalidad: modal.data.nacionalidad.trim(),
            apodo: modal.data.apodo.trim(),
            activo: modal.data.activo,
        };

        if (!payload.nombre) {
            setError('El nombre es obligatorio');
            return;
        }

        setGuardando(true);
        setError('');
        try {
            const endpoint = modal.esNuevo ? '/api/goleadores' : `/api/goleadores/${modal.id}`;
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
            const res = await fetch(`/api/goleadores/${confirmDelete.id}`, { method: 'DELETE' });
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
            <div className="flex items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-black">Goleadores</h1>
                    <p className="text-sm text-gray-500 mt-1">Crear y editar la tabla historica de maximos anotadores</p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="flex items-center gap-2 bg-[#A6192E] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#7E1325] transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    Nuevo Goleador
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
                <LoadingSpinner label="Cargando goleadores" />
            ) : ranking.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No hay goleadores registrados.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center gap-3 text-[#A6192E] mb-2">
                                <Medal size={18} />
                                <span className="text-xs font-semibold uppercase tracking-wide">Lider historico</span>
                            </div>
                            <p className="text-xl font-black text-black">{maximoGoleador?.nombre ?? 'Sin datos'}</p>
                            <p className="text-sm text-gray-500 mt-1">{maximoGoleador?.goles ?? 0} goles</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center gap-3 text-[#A6192E] mb-2">
                                <Star size={18} />
                                <span className="text-xs font-semibold uppercase tracking-wide">Registrados</span>
                            </div>
                            <p className="text-xl font-black text-black">{ranking.length}</p>
                            <p className="text-sm text-gray-500 mt-1">goleadores en la tabla</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center gap-3 text-[#A6192E] mb-2">
                                <UserRound size={18} />
                                <span className="text-xs font-semibold uppercase tracking-wide">Activos</span>
                            </div>
                            <p className="text-xl font-black text-black">{goleadoresActivos}</p>
                            <p className="text-sm text-gray-500 mt-1">jugadores actualmente vigentes</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {ranking.map((goleador, index) => (
                            <div key={goleador.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#F5E9D0] text-black font-bold text-sm">
                                                {index + 1}
                                            </span>
                                            <h3 className="text-lg font-bold text-black leading-tight">{goleador.nombre}</h3>
                                            {goleador.activo && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-[#A6192E]/10 text-[#A6192E] font-semibold px-2 py-0.5 rounded-full">
                                                    <Check size={12} />
                                                    Activo
                                                </span>
                                            )}
                                        </div>

                                        {goleador.apodo && (
                                            <p className="text-sm italic text-gray-500">&quot;{goleador.apodo}&quot;</p>
                                        )}

                                        {!!goleador.nombreCompleto && (
                                            <p className="text-sm text-gray-600 mt-2">{goleador.nombreCompleto}</p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                            <span className="px-2 py-1 rounded-full bg-[#A6192E]/10 text-[#A6192E] font-semibold">
                                                {goleador.goles} goles
                                            </span>
                                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                                {goleador.partidos} partidos
                                            </span>
                                            {goleador.nacionalidad && (
                                                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                                    {goleador.nacionalidad}
                                                </span>
                                            )}
                                        </div>

                                        {!!goleador.temporadas && (
                                            <p className="text-xs text-gray-500 mt-3">Temporadas: {goleador.temporadas}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => abrirEditar(goleador)}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete({ id: goleador.id, nombre: goleador.nombre })}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {modal.abierto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modal.esNuevo ? 'Nuevo Goleador' : 'Editar Goleador'}
                            </h2>
                            <button onClick={() => setModal((m) => ({ ...m, abierto: false }))} className="cursor-pointer text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={modal.data.nombre}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, nombre: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Ej: Lolo Fernandez"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo</label>
                                <input
                                    type="text"
                                    value={modal.data.nombreCompleto}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, nombreCompleto: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Ej: Teodoro Fernandez Melendez"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Goles</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={modal.data.goles}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, goles: Number(e.target.value || 0) } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Partidos</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={modal.data.partidos}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, partidos: Number(e.target.value || 0) } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nacionalidad</label>
                                <input
                                    type="text"
                                    value={modal.data.nacionalidad}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, nacionalidad: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Ej: Peru"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Apodo</label>
                                <input
                                    type="text"
                                    value={modal.data.apodo}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, apodo: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Opcional"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Temporadas</label>
                                <input
                                    type="text"
                                    value={modal.data.temporadas}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, temporadas: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Ej: 1932-1951 o 2018-presente"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Activo</label>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={modal.data.activo}
                                        onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, activo: e.target.checked } }))}
                                        className="rounded border-gray-300"
                                    />
                                    Marcar como jugador activo
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setModal((m) => ({ ...m, abierto: false }))}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardar}
                                disabled={guardando}
                                className="px-4 py-2.5 rounded-xl bg-[#A6192E] text-white text-sm font-semibold hover:bg-[#7E1325] disabled:opacity-60 cursor-pointer"
                            >
                                {guardando ? 'Guardando...' : modal.esNuevo ? 'Crear goleador' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-black text-black mb-2">Eliminar goleador</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Vas a eliminar a <span className="font-semibold text-black">{confirmDelete.nombre}</span>. Esta accion no se puede deshacer.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={eliminar}
                                disabled={guardando}
                                className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer"
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