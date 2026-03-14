import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

interface CamisetaInput {
    id: number;
    proveedor: string;
    colores: string[];
    descripcion: string;
    tipo: string;
    principal: string | null;
    imagenes: string[];
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ anio: string }> }
) {
    try {
        await crearTablas();

        const { anio: anioStr } = await params;
        const anio = Number(anioStr);
        const body = await req.json();

        const existing = await sql`SELECT anio FROM camisetas_temporadas WHERE anio = ${anio}`;
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
        }

        if ('camisetas' in body && Array.isArray(body.camisetas)) {
            const camisetas = body.camisetas as CamisetaInput[];

            await sql`DELETE FROM camisetas_items WHERE anio = ${anio}`;
            for (const c of camisetas) {
                await sql`
                    INSERT INTO camisetas_items (id, anio, proveedor, colores, descripcion, tipo, principal, imagenes)
                    VALUES (
                        ${Number(c.id)},
                        ${anio},
                        ${String(c.proveedor ?? '')},
                        ${JSON.stringify(c.colores ?? [])}::jsonb,
                        ${String(c.descripcion ?? '')},
                        ${String(c.tipo ?? 'Titular')},
                        ${c.principal ? String(c.principal) : null},
                        ${JSON.stringify(c.imagenes ?? [])}::jsonb
                    )
                `;
            }
        }

        const items = await sql`
            SELECT id, proveedor, colores, descripcion, tipo, principal, imagenes
            FROM camisetas_items
            WHERE anio = ${anio}
            ORDER BY id ASC
        `;

        return NextResponse.json({
            anio,
            camisetas: items.map((i) => ({
                id: i.id,
                proveedor: i.proveedor,
                colores: i.colores ?? [],
                descripcion: i.descripcion,
                tipo: i.tipo,
                principal: i.principal,
                imagenes: i.imagenes ?? [],
            })),
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar la temporada' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ anio: string }> }
) {
    try {
        await crearTablas();

        const { anio: anioStr } = await params;
        const anio = Number(anioStr);

        const existing = await sql`SELECT anio FROM camisetas_temporadas WHERE anio = ${anio}`;
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
        }

        await sql`DELETE FROM camisetas_temporadas WHERE anio = ${anio}`;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar la temporada' }, { status: 500 });
    }
}
