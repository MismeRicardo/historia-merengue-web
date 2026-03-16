import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

type HistoriaInput = {
    anio?: number;
    titulo?: string;
    descripcion?: string;
    icono?: string;
};

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

        const exists = await sql`SELECT id FROM historia_eventos WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
        }

        const body = (await req.json()) as HistoriaInput;
        const anio = Number(body.anio);
        const titulo = String(body.titulo ?? '').trim();
        const descripcion = String(body.descripcion ?? '').trim();
        const icono = String(body.icono ?? 'star').trim() || 'star';

        if (!Number.isFinite(anio) || !titulo) {
            return NextResponse.json(
                { error: 'Año y título son obligatorios' },
                { status: 400 }
            );
        }

        await sql`
            UPDATE historia_eventos
            SET anio = ${anio}, titulo = ${titulo}, descripcion = ${descripcion}, icono = ${icono}
            WHERE id = ${id}
        `;

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar evento histórico' }, { status: 500 });
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

        const exists = await sql`SELECT id FROM historia_eventos WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
        }

        await sql`DELETE FROM historia_eventos WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar evento histórico' }, { status: 500 });
    }
}
