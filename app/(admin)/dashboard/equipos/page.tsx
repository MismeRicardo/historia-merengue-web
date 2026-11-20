'use client';

import LoadingSpinner from '@/components/loading-spinner';
import { Pencil, Plus, Shield, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Equipo = {
    id: number;
    nombre: string;
    escudoUrl: string | null;
};

export default function EquiposPage() {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [modal, setModal] = useState<{
        abierto: boolean;
        esNuevo: boolean;
        id: number | null;
        nombre: string;
        escudoUrl: string | null;
    }>({ abierto: false, esNuevo: true, id: null, nombre: '', escudoUrl: null });
    const [confirmar, setConfirmar] = useState<Equipo | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const res = await fetch('/api/equipos');
            if (!res.ok) throw new Error();
            setEquipos(await res.json());
        } catch {
            setError('No se pudieron cargar los equipos');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const abrirNuevo = () => {
        setArchivo(null);
        setModal({ abierto: true, esNuevo: true, id: null, nombre: '', escudoUrl: null });
    };

    const abrirEditar = (equipo: Equipo) => {
        setArchivo(null);
        setModal({
            abierto: true,
            esNuevo: false,
            id: equipo.id,
            nombre: equipo.nombre,
            escudoUrl: equipo.escudoUrl,
        });
    };

    const guardar = async () => {
        const nombre = modal.nombre.trim();
        if (!nombre) {
            setError('El nombre del equipo es obligatorio');
            return;
        }

        setGuardando(true);
        setError('');
        let escudoUrl = modal.escudoUrl;
        let nuevaUrl: string | null = null;

        try {
            if (archivo) {
                const form = new FormData();
                form.append('file', archivo);
                const upload = await fetch('/api/equipos/upload', { method: 'POST', body: form });
                const data = await upload.json();
                if (!upload.ok) {
                    setError(data.error ?? 'No se pudo subir el escudo');
                    return;
                }
                escudoUrl = data.url;
                nuevaUrl = data.url;
            }

            const endpoint = modal.esNuevo ? '/api/equipos' : `/api/equipos/${modal.id}`;
            const res = await fetch(endpoint, {
                method: modal.esNuevo ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, escudoUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? 'No se pudo guardar el equipo');
                if (nuevaUrl) {
                    await fetch('/api/equipos/upload', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: nuevaUrl }),
                    }).catch(() => undefined);
                }
                return;
            }

            setModal((m) => ({ ...m, abierto: false }));
            setArchivo(null);
            await cargar();
        } catch {
            setError('Error de conexión');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async () => {
        if (!confirmar) return;
        setGuardando(true);
        setError('');
        try {
            const res = await fetch(`/api/equipos/${confirmar.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? 'No se pudo eliminar el equipo');
                return;
            }
            setConfirmar(null);
            await cargar();
        } catch {
            setError('Error de conexión');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-black">Equipos</h1>
                    <p className="text-sm text-gray-500 mt-1">Catálogo de equipos y escudos</p>
                </div>
                <button onClick={abrirNuevo} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A6192E] text-white text-sm font-semibold cursor-pointer">
                    <Plus size={16} />
                    Nuevo equipo
                </button>
            </div>

            {error && (
                <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            {cargando ? (
                <LoadingSpinner label="Cargando equipos" />
            ) : equipos.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No hay equipos registrados.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {equipos.map((equipo) => (
                        <div key={equipo.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {equipo.escudoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={equipo.escudoUrl} alt={equipo.nombre} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Shield size={28} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-black truncate">{equipo.nombre}</h3>
                                    <p className="text-xs text-gray-400 mt-1">ID {equipo.id}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => abrirEditar(equipo)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                                        <Pencil size={15} />
                                    </button>
                                    <button onClick={() => setConfirmar(equipo)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer">
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">{modal.esNuevo ? 'Nuevo equipo' : 'Editar equipo'}</h2>
                            <button onClick={() => setModal((m) => ({ ...m, abierto: false }))} className="text-gray-400 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <label className="block text-xs font-semibold text-gray-600 mb-2">Escudo</label>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                {archivo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={URL.createObjectURL(archivo)} alt="Vista previa" className="w-full h-full object-contain p-1" />
                                ) : modal.escudoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={modal.escudoUrl} alt="Escudo actual" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <Shield size={32} className="text-gray-400" />
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                                    className="block text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#A6192E]/10 file:text-[#A6192E]"
                                />
                                {(modal.escudoUrl || archivo) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setArchivo(null);
                                            setModal((m) => ({ ...m, escudoUrl: null }));
                                        }}
                                        className="mt-3 text-xs font-semibold text-red-600 cursor-pointer"
                                    >
                                        Quitar escudo
                                    </button>
                                )}
                            </div>
                        </div>

                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={modal.nombre}
                            onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))}
                            placeholder="Ej: Club Alianza Lima"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black"
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setModal((m) => ({ ...m, abierto: false }))} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm cursor-pointer">Cancelar</button>
                            <button onClick={guardar} disabled={guardando} className="px-4 py-2.5 rounded-xl bg-[#A6192E] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer">
                                {guardando ? 'Guardando...' : modal.esNuevo ? 'Crear equipo' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmar && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-black text-lg mb-2">Eliminar equipo</h3>
                        <p className="text-sm text-gray-600">¿Eliminar a <span className="font-semibold">{confirmar.nombre}</span>?</p>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setConfirmar(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm cursor-pointer">Cancelar</button>
                            <button onClick={eliminar} disabled={guardando} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm cursor-pointer">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
