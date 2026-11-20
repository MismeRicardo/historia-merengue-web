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
        const tipo = String(form.get('tipo') ?? 'personas')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'personas';
        const file = form.get('file');

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: 'No se recibió una imagen' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 });
        }

        const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
        const safeExt = (ext ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const filename = `${tipo}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
        const blob = await put(filename, file, {
            access: 'public',
            addRandomSuffix: true,
        });

        return NextResponse.json({ url: blob.url });
    } catch (err) {
        console.error('[upload persona]', err);
        return NextResponse.json({ error: 'Error al subir la imagen a Blob' }, { status: 500 });
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
        const url = typeof body?.url === 'string' ? body.url : '';

        if (!url.startsWith('http')) {
            return NextResponse.json({ error: 'No se recibió una URL válida' }, { status: 400 });
        }

        await del(url);
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[delete persona blob]', err);
        return NextResponse.json({ error: 'Error al eliminar la imagen del Blob' }, { status: 500 });
    }
}
