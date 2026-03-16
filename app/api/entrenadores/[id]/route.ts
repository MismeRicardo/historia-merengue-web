import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

type Periodo = {
    desde: number;
    hasta: number | null;
};

type EntrenadorInput = {
    nombre?: string;
    nacionalidad?: string;
    periodos?: Periodo[];
    titulos?: number;
    descripcion?: string;
    activo?: boolean;
};

function limpiarPeriodos(periodos: unknown): Periodo[] {
    if (!Array.isArray(periodos)) return [];
    return periodos
        .map((p) => ({
            desde: Number((p as Periodo).desde),
            hasta: (p as Periodo).hasta === null ? null : Number((p as Periodo).hasta),
        }))
        .filter((p) => Number.isFinite(p.desde) && p.desde > 0 && (p.hasta === null || Number.isFinite(p.hasta)));
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await crearTablas();

        const { id: idStr } = await params;
        const id = Number(idStr);
        if (!id) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const exists = await sql`SELECT id FROM entrenadores WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Entrenador no encontrado' }, { status: 404 });
        }

        const body = (await req.json()) as EntrenadorInput;
        const nombre = String(body.nombre ?? '').trim();

        if (!nombre) {
            return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
        }

        const nacionalidad = String(body.nacionalidad ?? '').trim();
        const periodos = limpiarPeriodos(body.periodos);
        const titulos = Math.max(0, Number(body.titulos ?? 0) || 0);
        const descripcion = String(body.descripcion ?? '').trim();
        const activo = Boolean(body.activo);

        await sql`
            UPDATE entrenadores
            SET
                nombre = ${nombre},
                nacionalidad = ${nacionalidad},
                periodos = ${JSON.stringify(periodos)}::jsonb,
                titulos_cantidad = ${titulos},
                descripcion = ${descripcion},
                activo = ${activo}
            WHERE id = ${id}
        `;

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar entrenador' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await crearTablas();

        const { id: idStr } = await params;
        const id = Number(idStr);
        if (!id) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const exists = await sql`SELECT id FROM entrenadores WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Entrenador no encontrado' }, { status: 404 });
        }

        await sql`DELETE FROM entrenadores WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar entrenador' }, { status: 500 });
    }
}
