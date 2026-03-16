'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, ShieldCheck } from 'lucide-react';

type Periodo = {
    desde: number;
    hasta: number | null;
};

type Entrenador = {
    id: number;
    nombre: string;
    nacionalidad: string;
    periodos: Periodo[];
    titulos: number;
    descripcion: string;
    activo: boolean;
};

type FormData = {
    nombre: string;
    nacionalidad: string;
    periodosText: string;
    titulos: number;
    descripcion: string;
    activo: boolean;
};

const EMPTY_FORM: FormData = {
    nombre: '',
    nacionalidad: 'Peru',
    periodosText: '',
    titulos: 0,
    descripcion: '',
    activo: false,
};

function periodosToText(periodos: Periodo[]): string {
    return periodos
        .map((p) => p.desde)
        .filter((anio, idx, arr) => arr.indexOf(anio) === idx)
        .sort((a, b) => a - b)
        .join(', ');
}

function parsePeriodos(texto: string): Periodo[] {
    if (!texto.trim()) return [];

    const anios = texto
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => Number(item))
        .filter((anio) => Number.isFinite(anio) && anio > 0);

    const unicosOrdenados = Array.from(new Set(anios)).sort((a, b) => a - b);
    return unicosOrdenados.map((anio) => ({ desde: anio, hasta: anio }));
}

function formatPeriodos(periodos: Periodo[]): string {
    if (!periodos.length) return 'Sin periodos';
    return periodos
        .map((p) => p.desde)
        .filter((anio, idx, arr) => arr.indexOf(anio) === idx)
        .sort((a, b) => a - b)
        .join(', ');
}

export default function EntrenadoresPage() {
    const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
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
            const res = await fetch('/api/entrenadores');
            if (!res.ok) throw new Error('Error al cargar entrenadores');
            const data = (await res.json()) as Entrenador[];
            setEntrenadores(data);
        } catch {
            setError('No se pudieron cargar los entrenadores');
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

    const abrirEditar = (ent: Entrenador) => {
        setModal({
            abierto: true,
            esNuevo: false,
            id: ent.id,
            data: {
                nombre: ent.nombre,
                nacionalidad: ent.nacionalidad,
                periodosText: periodosToText(ent.periodos),
                titulos: Number(ent.titulos || 0),
                descripcion: ent.descripcion,
                activo: ent.activo,
            },
        });
    };

    const guardar = async () => {
        const payload = {
            nombre: modal.data.nombre.trim(),
            nacionalidad: modal.data.nacionalidad.trim(),
            periodos: parsePeriodos(modal.data.periodosText),
            titulos: Math.max(0, Number(modal.data.titulos || 0)),
            descripcion: modal.data.descripcion.trim(),
            activo: modal.data.activo,
        };

        if (!payload.nombre) {
            setError('El nombre es obligatorio');
            return;
        }

        setGuardando(true);
        setError('');

        try {
            const endpoint = modal.esNuevo ? '/api/entrenadores' : `/api/entrenadores/${modal.id}`;
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
            const res = await fetch(`/api/entrenadores/${confirmDelete.id}`, { method: 'DELETE' });
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

    const activos = useMemo(() => entrenadores.filter((e) => e.activo).length, [entrenadores]);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-black">Entrenadores</h1>
                    <p className="text-sm text-gray-500 mt-1">Crear y editar entrenadores historicos</p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="flex items-center gap-2 bg-[#A6192E] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#7E1325] transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    Nuevo Entrenador
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="text-gray-500 text-xs">Total</div>
                    <div className="text-3xl font-black text-black">{entrenadores.length}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="text-gray-500 text-xs">Activos</div>
                    <div className="text-3xl font-black text-[#16a34a]">{activos}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="text-gray-500 text-xs">Historicos</div>
                    <div className="text-3xl font-black text-[#A6192E]">{entrenadores.length - activos}</div>
                </div>
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
                <div className="text-center py-20 text-gray-400">Cargando...</div>
            ) : entrenadores.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No hay entrenadores registrados.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {entrenadores.map((ent) => (
                        <div key={ent.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base font-bold text-black leading-tight">{ent.nombre}</h3>
                                        {ent.activo && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                                                <ShieldCheck size={12} />
                                                Activo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">{ent.nacionalidad || 'Sin nacionalidad'}</p>
                                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{formatPeriodos(ent.periodos)}</p>
                                    {!!ent.descripcion && (
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-3">{ent.descripcion}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {ent.titulos > 0 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-[#A6192E]/10 text-[#A6192E] font-medium">
                                                {ent.titulos} titulos
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => abrirEditar(ent)}
                                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete({ id: ent.id, nombre: ent.nombre })}
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modal.esNuevo ? 'Nuevo Entrenador' : 'Editar Entrenador'}
                            </h2>
                            <button onClick={() => setModal((m) => ({ ...m, abierto: false }))} className="cursor-pointer text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={modal.data.nombre}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, nombre: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Ej: Roberto Chale"
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
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Titulos</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={modal.data.titulos}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, titulos: Number(e.target.value || 0) } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Periodos</label>
                                <input
                                    type="text"
                                    value={modal.data.periodosText}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, periodosText: e.target.value } }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none"
                                    placeholder="Ej: 2012, 2013, 2018, 2019"
                                />
                                <p className="text-xs text-gray-400 mt-1">Formato: años separados por comas.</p>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripcion</label>
                                <textarea
                                    value={modal.data.descripcion}
                                    onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, descripcion: e.target.value } }))}
                                    rows={4}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#A6192E]/30 focus:border-[#A6192E] outline-none resize-y"
                                    placeholder="Resumen del paso del entrenador por el club"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={modal.data.activo}
                                        onChange={(e) => setModal((m) => ({ ...m, data: { ...m.data, activo: e.target.checked } }))}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Marcar como entrenador activo</span>
                                </label>
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
                        <h3 className="font-bold text-black text-lg mb-2">Eliminar entrenador</h3>
                        <p className="text-sm text-gray-600">
                            Estas seguro de eliminar a <span className="font-semibold">{confirmDelete.nombre}</span>?
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
