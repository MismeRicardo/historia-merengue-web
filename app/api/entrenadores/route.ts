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

export async function GET() {
    try {
        await crearTablas();

        const rows = await sql`
            SELECT id, nombre, nacionalidad, periodos, titulos_cantidad, descripcion, activo
            FROM entrenadores
            ORDER BY activo DESC, id ASC
        `;

        return NextResponse.json(
            rows.map((r) => ({
                id: r.id,
                nombre: r.nombre,
                nacionalidad: r.nacionalidad,
                periodos: r.periodos ?? [],
                titulos: Number(r.titulos_cantidad ?? 0),
                descripcion: r.descripcion,
                activo: r.activo,
            }))
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer entrenadores' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();

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

        const max = await sql`SELECT COALESCE(MAX(id), 0) AS max_id FROM entrenadores`;
        const id = Number(max[0]?.max_id ?? 0) + 1;

        await sql`
            INSERT INTO entrenadores (id, nombre, nacionalidad, periodos, titulos_cantidad, descripcion, activo)
            VALUES (
                ${id},
                ${nombre},
                ${nacionalidad},
                ${JSON.stringify(periodos)}::jsonb,
                ${titulos},
                ${descripcion},
                ${activo}
            )
        `;

        return NextResponse.json({ ok: true, id }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear entrenador' }, { status: 500 });
    }
}
