import { del, put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json(
                { error: 'Falta configurar BLOB_READ_WRITE_TOKEN en el entorno' },
                { status: 500 }
            );
        }

        const form = await req.formData();
        const anio = String(form.get('anio') ?? 'sin-anio');
        const tipo = String(form.get('tipo') ?? 'camiseta')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'camiseta';

        const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
        if (files.length === 0) {
            return NextResponse.json({ error: 'No se recibieron imágenes' }, { status: 400 });
        }

        const uploads = await Promise.all(
            files.map(async (file, idx) => {
                const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
                const safeExt = (ext ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
                const filename = `camisetas/${anio}/${tipo}/${Date.now()}-${idx}.${safeExt}`;

                const blob = await put(filename, file, {
                    access: 'public',
                    addRandomSuffix: true,
                });

                return blob.url;
            })
        );

        return NextResponse.json({ urls: uploads });
    } catch (err) {
        console.error('[upload camisetas]', err);
        return NextResponse.json({ error: 'Error al subir imágenes a Blob' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json(
                { error: 'Falta configurar BLOB_READ_WRITE_TOKEN en el entorno' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const urls = Array.isArray(body?.urls)
            ? body.urls.filter((u: unknown): u is string => typeof u === 'string' && u.startsWith('http'))
            : [];

        if (urls.length === 0) {
            return NextResponse.json({ error: 'No se enviaron URLs para eliminar' }, { status: 400 });
        }

        await del(urls);
        return NextResponse.json({ ok: true, eliminadas: urls.length });
    } catch (err) {
        console.error('[delete camisetas blob]', err);
        return NextResponse.json({ error: 'Error al eliminar imágenes del Blob' }, { status: 500 });
    }
}
