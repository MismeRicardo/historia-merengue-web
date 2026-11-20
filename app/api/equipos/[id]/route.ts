import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await crearTablas();
        const { id: idStr } = await params;
        const id = Number(idStr);
        const body = await req.json();
        const nombre = String(body.nombre ?? '').trim();
        const escudoUrl = typeof body.escudoUrl === 'string' && body.escudoUrl.trim()
            ? body.escudoUrl.trim()
            : null;

        if (!id || !nombre) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        const existente = await sql`SELECT id, escudo_url FROM equipos WHERE id = ${id}`;
        if (existente.length === 0) {
            return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
        }

        await sql`
            UPDATE equipos
            SET nombre = ${nombre}, escudo_url = ${escudoUrl}
            WHERE id = ${id}
        `;

        const anterior = typeof existente[0].escudo_url === 'string' ? existente[0].escudo_url : '';
        if (anterior.startsWith('http') && anterior !== escudoUrl) {
            try {
                await del(anterior);
            } catch (err) {
                console.error('[delete equipo anterior]', err);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar equipo' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await crearTablas();
        const { id: idStr } = await params;
        const id = Number(idStr);
        const existente = await sql`SELECT escudo_url FROM equipos WHERE id = ${id}`;
        if (existente.length === 0) {
            return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
        }

        await sql`DELETE FROM equipos WHERE id = ${id}`;
        const anterior = typeof existente[0].escudo_url === 'string' ? existente[0].escudo_url : '';
        if (anterior.startsWith('http')) {
            await del(anterior);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar equipo' }, { status: 500 });
    }
}
