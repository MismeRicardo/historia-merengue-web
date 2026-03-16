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

export async function GET() {
    try {
        await crearTablas();

        const rows = await sql`
            SELECT id, nombre, nombre_completo, goles, temporadas, partidos, nacionalidad, apodo, activo
            FROM goleadores
            ORDER BY goles DESC, partidos ASC, id ASC
        `;

        return NextResponse.json(
            rows.map((row) => ({
                id: row.id,
                nombre: row.nombre,
                nombreCompleto: row.nombre_completo,
                goles: Number(row.goles ?? 0),
                temporadas: row.temporadas,
                partidos: Number(row.partidos ?? 0),
                nacionalidad: row.nacionalidad,
                apodo: row.apodo,
                activo: row.activo,
            }))
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer goleadores' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();

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

        const max = await sql`SELECT COALESCE(MAX(id), 0) AS max_id FROM goleadores`;
        const id = Number(max[0]?.max_id ?? 0) + 1;

        await sql`
            INSERT INTO goleadores (id, nombre, nombre_completo, goles, temporadas, partidos, nacionalidad, apodo, activo)
            VALUES (
                ${id},
                ${nombre},
                ${nombreCompleto},
                ${goles},
                ${temporadas},
                ${partidos},
                ${nacionalidad},
                ${apodo || null},
                ${activo}
            )
        `;

        return NextResponse.json({ ok: true, id }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear goleador' }, { status: 500 });
    }
}