import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

type GoleadorInput = {
    nombre?: string;
    nombreCompleto?: string;
    goles?: number;
    temporadas?: string;
    partidos?: number;
    nacionalidad?: string;
    apodo?: string | null;
    activo?: boolean;
};

function limpiarTexto(valor: unknown): string {
    return String(valor ?? '').trim();
}

function limpiarNumero(valor: unknown): number {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero) ? Math.max(0, numero) : 0;
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
            return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
        }

        const exists = await sql`SELECT id FROM goleadores WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Goleador no encontrado' }, { status: 404 });
        }

        const body = (await req.json()) as GoleadorInput;
        const nombre = limpiarTexto(body.nombre);

        if (!nombre) {
            return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
        }

        const nombreCompleto = limpiarTexto(body.nombreCompleto);
        const goles = limpiarNumero(body.goles);
        const temporadas = limpiarTexto(body.temporadas);
        const partidos = limpiarNumero(body.partidos);
        const nacionalidad = limpiarTexto(body.nacionalidad);
        const apodo = limpiarTexto(body.apodo);
        const activo = Boolean(body.activo);

        await sql`
            UPDATE goleadores
            SET
                nombre = ${nombre},
                nombre_completo = ${nombreCompleto},
                goles = ${goles},
                temporadas = ${temporadas},
                partidos = ${partidos},
                nacionalidad = ${nacionalidad},
                apodo = ${apodo || null},
                activo = ${activo}
            WHERE id = ${id}
        `;

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar goleador' }, { status: 500 });
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
            return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
        }

        const exists = await sql`SELECT id FROM goleadores WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Goleador no encontrado' }, { status: 404 });
        }

        await sql`DELETE FROM goleadores WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar goleador' }, { status: 500 });
    }
}