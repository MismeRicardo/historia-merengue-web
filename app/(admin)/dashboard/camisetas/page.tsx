'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, Shirt, X, Check } from 'lucide-react';

interface Camiseta {
    id: number;
    proveedor: string;
    colores: string[];
    descripcion: string;
    tipo: string;
    principal: string | null;
    imagenes: string[];
}

interface TemporadaCamisetas {
    anio: number;
    camisetas: Camiseta[];
}

const EMPTY_TEMP: Partial<TemporadaCamisetas> = { anio: new Date().getFullYear(), camisetas: [] };
const EMPTY_CAM: Partial<Camiseta> = {
    proveedor: '',
    colores: ['Blanco', 'Rojo'],
    descripcion: '',
    tipo: 'Titular',
    principal: '',
    imagenes: [],
};

function parseLista(input: string): string[] {
    return input
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function CamisetasPage() {
    const [temporadas, setTemporadas] = useState<TemporadaCamisetas[]>([]);
    const [cargando, setCargando] = useState(true);
    const [expandida, setExpandida] = useState<number | null>(null);

    const [modalTemp, setModalTemp] = useState<{
        abierto: boolean;
        esNueva: boolean;
        datos: Partial<TemporadaCamisetas>;
        original: number | null;
    }>({ abierto: false, esNueva: true, datos: { ...EMPTY_TEMP }, original: null });

    const [modalCam, setModalCam] = useState<{
        abierto: boolean;
        anio: number;
        esNueva: boolean;
        datos: Partial<Camiseta>;
    }>({ abierto: false, anio: 0, esNueva: true, datos: { ...EMPTY_CAM } });

    const [confirmar, setConfirmar] = useState<{
        tipo: 'temporada' | 'camiseta';
        anio: number;
        camisetaId?: number;
        mensaje: string;
    } | null>(null);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
    const [imagenesEliminadas, setImagenesEliminadas] = useState<string[]>([]);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await fetch('/api/camisetas');
            const data = await res.json();
            setTemporadas(data);
        } catch {
            setError('Error al cargar las camisetas');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const eliminarImagenExistente = (url: string) => {
        setImagenesEliminadas((prev) => (prev.includes(url) ? prev : [...prev, url]));
        setModalCam((m) => {
            const imagenes = (m.datos.imagenes ?? []).filter((img) => img !== url);
            const principal = m.datos.principal === url ? (imagenes[0] ?? null) : m.datos.principal;
            return { ...m, datos: { ...m.datos, imagenes, principal } };
        });
    };

    const marcarComoPrincipal = (url: string) => {
        setModalCam((m) => ({ ...m, datos: { ...m.datos, principal: url } }));
    };

    const eliminarImagenesDeBlob = async (urls: string[]) => {
        if (urls.length === 0) return;

        const res = await fetch('/api/camisetas/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls }),
        });

        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error ?? 'Se guardó, pero falló la eliminación en Blob');
        }
    };

    const subirImagenesABlob = async (anio: number, tipo: string): Promise<string[]> => {
        if (archivosSeleccionados.length === 0) return [];

        const form = new FormData();
        form.append('anio', String(anio));
        form.append('tipo', tipo);
        for (const file of archivosSeleccionados) {
            form.append('files', file);
        }

        const res = await fetch('/api/camisetas/upload', {
            method: 'POST',
            body: form,
        });

        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error ?? 'Error al subir imágenes');
        }

        const data = await res.json();
        return Array.isArray(data.urls) ? data.urls : [];
    };

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
                const res = await fetch('/api/camisetas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ anio: datos.anio, camisetas: [] }),
                });
                if (!res.ok) {
                    const d = await res.json();
                    setError(d.error ?? 'Error al crear temporada');
                    return;
                }
            } else {
                // Para este CRUD el año no se renombra; solo se mantiene la temporada.
                const temp = temporadas.find((t) => t.anio === original);
                if (!temp) {
                    setError('Temporada no encontrada');
                    return;
                }
                const res = await fetch(`/api/camisetas/${original}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ camisetas: temp.camisetas }),
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

    const guardarCamiseta = async () => {
        setGuardando(true);
        setError('');
        try {
            const { anio, esNueva, datos } = modalCam;
            const temp = temporadas.find((t) => t.anio === anio);
            if (!temp) {
                setError('Temporada no encontrada');
                return;
            }

            const colores = Array.isArray(datos.colores) ? datos.colores : [];
            const imagenesActuales = Array.isArray(datos.imagenes) ? datos.imagenes : [];
            const urlsSubidas = await subirImagenesABlob(anio, String(datos.tipo ?? 'Titular'));
            const imagenes = [...imagenesActuales, ...urlsSubidas];
            const principalFinal = datos.principal
                ? String(datos.principal)
                : (imagenes[0] ?? null);

            const payload: Camiseta = {
                id: Number(datos.id ?? 0),
                proveedor: String(datos.proveedor ?? ''),
                colores,
                descripcion: String(datos.descripcion ?? ''),
                tipo: String(datos.tipo ?? 'Titular'),
                principal: principalFinal,
                imagenes,
            };

            let camisetas: Camiseta[];
            if (esNueva) {
                const maxId = temp.camisetas.reduce((m, c) => Math.max(m, c.id), 0);
                camisetas = [...temp.camisetas, { ...payload, id: maxId + 1 }];
            } else {
                camisetas = temp.camisetas.map((c) => (c.id === payload.id ? payload : c));
            }

            const res = await fetch(`/api/camisetas/${anio}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ camisetas }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? 'Error al guardar camiseta');
                return;
            }

            if (imagenesEliminadas.length > 0) {
                await eliminarImagenesDeBlob(imagenesEliminadas);
            }

            setModalCam((m) => ({ ...m, abierto: false }));
            setArchivosSeleccionados([]);
            setImagenesEliminadas([]);
            await cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de conexión');
        } finally {
            setGuardando(false);
        }
    };

    const ejecutarBorrado = async () => {
        if (!confirmar) return;
        setGuardando(true);
        try {
            if (confirmar.tipo === 'temporada') {
                await fetch(`/api/camisetas/${confirmar.anio}`, { method: 'DELETE' });
                setExpandida(null);
            } else {
                const temp = temporadas.find((t) => t.anio === confirmar.anio);
                if (!temp) return;
                const camisetas = temp.camisetas.filter((c) => c.id !== confirmar.camisetaId);
                await fetch(`/api/camisetas/${confirmar.anio}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ camisetas }),
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
                    <h1 className="text-2xl font-black text-black">Camisetas</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de camisetas por temporada</p>
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
                                                <Shirt size={11} />
                                                {temp.camisetas.length} camisetas
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
                                                mensaje: `¿Eliminar la temporada ${temp.anio} y sus ${temp.camisetas.length} camisetas?`,
                                            })}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {abierta && (
                                    <div className="border-t border-gray-100">
                                        {temp.camisetas.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-6">Sin camisetas. Agregá la primera.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 w-12">#</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tipo</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Proveedor</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Imágenes</th>
                                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Principal</th>
                                                            <th className="px-4 py-3 w-20"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {temp.camisetas.map((cam) => (
                                                            <tr key={cam.id} className="hover:bg-gray-50/50">
                                                                <td className="px-6 py-3 font-mono font-bold text-gray-500">{cam.id}</td>
                                                                <td className="px-4 py-3 font-medium text-gray-800">{cam.tipo}</td>
                                                                <td className="px-4 py-3 text-gray-700">{cam.proveedor || '—'}</td>
                                                                <td className="px-4 py-3 text-gray-600">{cam.imagenes?.length ?? 0}</td>
                                                                <td className="px-4 py-3 text-gray-600">
                                                                    {cam.principal ? (
                                                                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5 font-semibold">
                                                                            Definida
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5 font-semibold">
                                                                            Sin principal
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex justify-end gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setArchivosSeleccionados([]);
                                                                                setImagenesEliminadas([]);
                                                                                setModalCam({ abierto: true, anio: temp.anio, esNueva: false, datos: { ...cam } });
                                                                            }}
                                                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                                                        >
                                                                            <Pencil size={13} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setConfirmar({
                                                                                tipo: 'camiseta',
                                                                                anio: temp.anio,
                                                                                camisetaId: cam.id,
                                                                                mensaje: `¿Eliminar la camiseta \"${cam.tipo}\"?`,
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
                                                    setArchivosSeleccionados([]);
                                                    setImagenesEliminadas([]);
                                                    setModalCam({ abierto: true, anio: temp.anio, esNueva: true, datos: { ...EMPTY_CAM } });
                                                }}
                                                className="flex items-center gap-1.5 text-sm text-[#A6192E] font-semibold hover:underline cursor-pointer"
                                            >
                                                <Plus size={14} />
                                                Agregar Camiseta
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

            {modalCam.abierto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-black text-black text-lg">
                                {modalCam.esNueva ? 'Agregar Camiseta' : 'Editar Camiseta'}
                            </h2>
                            <button onClick={() => setModalCam((m) => ({ ...m, abierto: false }))} className="cursor-pointer text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                                <input
                                    type="text"
                                    value={modalCam.datos.tipo ?? ''}
                                    onChange={(e) => setModalCam((m) => ({ ...m, datos: { ...m.datos, tipo: e.target.value } }))}
                                    placeholder="Titular / Alternativa / ..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Proveedor</label>
                                <input
                                    type="text"
                                    value={modalCam.datos.proveedor ?? ''}
                                    onChange={(e) => setModalCam((m) => ({ ...m, datos: { ...m.datos, proveedor: e.target.value } }))}
                                    placeholder="Umbro, Adidas, ..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={modalCam.datos.descripcion ?? ''}
                                    onChange={(e) => setModalCam((m) => ({ ...m, datos: { ...m.datos, descripcion: e.target.value } }))}
                                    placeholder="Detalle de diseño, cuello, franjas, etc."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Colores (coma separada)</label>
                                <input
                                    type="text"
                                    value={(modalCam.datos.colores ?? []).join(', ')}
                                    onChange={(e) => setModalCam((m) => ({ ...m, datos: { ...m.datos, colores: parseLista(e.target.value) } }))}
                                    placeholder="Blanco, Rojo"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Imágenes actuales</label>
                                {(modalCam.datos.imagenes ?? []).length === 0 ? (
                                    <p className="text-xs text-gray-500">No hay imágenes aún para esta camiseta.</p>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {(modalCam.datos.imagenes ?? []).map((url, idx) => {
                                            const esPrincipal = modalCam.datos.principal === url;
                                            return (
                                                <div key={`${idx}-${url}`} className="border border-gray-200 rounded-xl p-2">
                                                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                                                        <Image
                                                            src={url}
                                                            alt={`Camiseta ${idx + 1}`}
                                                            fill
                                                            sizes="(max-width: 768px) 50vw, 25vw"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="mt-2 flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => marcarComoPrincipal(url)}
                                                            className={`flex-1 text-[11px] rounded-md px-2 py-1 font-semibold cursor-pointer ${esPrincipal
                                                                ? 'bg-[#A6192E] text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {esPrincipal ? 'Principal' : 'Marcar'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarImagenExistente(url)}
                                                            className="text-[11px] rounded-md px-2 py-1 font-semibold bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Subir imágenes (Vercel Blob)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setArchivosSeleccionados(Array.from(e.target.files ?? []))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-[#A6192E] file:px-3 file:py-1.5 file:text-white file:text-xs file:font-semibold"
                                />
                                {archivosSeleccionados.length > 0 && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {archivosSeleccionados.length} imagen(es) lista(s) para subir al guardar.
                                    </p>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => {
                                    setArchivosSeleccionados([]);
                                    setImagenesEliminadas([]);
                                    setModalCam((m) => ({ ...m, abierto: false }));
                                }}
                                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarCamiseta}
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
