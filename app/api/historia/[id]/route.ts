import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import sql, { crearTablas } from '@/lib/db';

type HistoriaInput = {
    anio?: number;
    titulo?: string;
    descripcion?: string;
    icono?: string;
    imagenUrl?: string | null;
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

        const exists = await sql`SELECT id, imagen_url FROM historia_eventos WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
        }

        const body = (await req.json()) as HistoriaInput;
        const anio = Number(body.anio);
        const titulo = String(body.titulo ?? '').trim();
        const descripcion = String(body.descripcion ?? '').trim();
        const icono = String(body.icono ?? 'star').trim() || 'star';
        const imagenUrl = typeof body.imagenUrl === 'string' && body.imagenUrl.trim()
            ? body.imagenUrl.trim()
            : null;

        if (!Number.isFinite(anio) || !titulo) {
            return NextResponse.json(
                { error: 'Año y título son obligatorios' },
                { status: 400 }
            );
        }

        await sql`
            UPDATE historia_eventos
            SET anio = ${anio}, titulo = ${titulo}, descripcion = ${descripcion}, icono = ${icono}, imagen_url = ${imagenUrl}
            WHERE id = ${id}
        `;

        const imagenAnterior = typeof exists[0]?.imagen_url === 'string' ? exists[0].imagen_url : '';
        if (imagenAnterior.startsWith('http') && imagenAnterior !== imagenUrl) {
            try {
                await del(imagenAnterior);
            } catch (err) {
                console.error('[delete historia anterior]', err);
            }
        }

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

        const exists = await sql`SELECT id, imagen_url FROM historia_eventos WHERE id = ${id}`;
        if (exists.length === 0) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
        }

        await sql`DELETE FROM historia_eventos WHERE id = ${id}`;
        const imagenAnterior = typeof exists[0]?.imagen_url === 'string' ? exists[0].imagen_url : '';
        if (imagenAnterior.startsWith('http')) {
            await del(imagenAnterior);
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar evento histórico' }, { status: 500 });
    }
}
