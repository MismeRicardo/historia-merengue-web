import { Trophy, Users, BookOpen, Swords, Medal, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STATS: { label: string; value: string; Icon: LucideIcon; bg: string }[] = [
    { label: 'Títulos Nacionales', value: '30', Icon: Trophy, bg: 'bg-[#A6192E]' },
    { label: 'Años de Historia', value: '102', Icon: Clock, bg: 'bg-black' },
    { label: 'Jugadores en BD', value: '52', Icon: Users, bg: 'bg-[#C9A84C]' },
    { label: 'Eventos Históricos', value: '9', Icon: BookOpen, bg: 'bg-[#7E1325]' },
];

const ACCIONES: { href: string; Icon: LucideIcon; titulo: string; desc: string }[] = [
    {
        href: '/dashboard/partidos',
        Icon: Swords,
        titulo: 'Gestionar Partidos',
        desc: 'Editar último resultado y próximo partido',
    },
    {
        href: '/dashboard/plantel',
        Icon: Users,
        titulo: 'Gestionar Plantel',
        desc: 'Agregar o editar jugadores por temporada',
    },
    {
        href: '/dashboard/goleadores',
        Icon: Medal,
        titulo: 'Goleadores Históricos',
        desc: 'Actualizar tabla de máximos anotadores',
    },
    {
        href: '/dashboard/historia',
        Icon: BookOpen,
        titulo: 'Historia del Club',
        desc: 'Agregar o editar eventos históricos',
    },
];

export default function DashboardPage() {
    const ahora = new Date().toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-black">Panel Principal</h1>
                <p className="text-sm text-gray-500 mt-1 capitalize">{ahora}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {STATS.map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-6 text-white`}>
                        <s.Icon size={28} className="mb-3 opacity-90" />
                        <div className="text-4xl font-black">{s.value}</div>
                        <div className="text-sm opacity-75 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <h2 className="text-lg font-bold text-black mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {ACCIONES.map((a) => (
                    <a
                        key={a.href}
                        href={a.href}
                        className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-[#A6192E]/30 transition-all group"
                    >
                        <a.Icon size={28} className="mb-3 text-[#A6192E]" />
                        <div className="font-bold text-black group-hover:text-[#A6192E] transition-colors">
                            {a.titulo}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{a.desc}</div>
                    </a>
                ))}
            </div>            
        </div>
    );
}
