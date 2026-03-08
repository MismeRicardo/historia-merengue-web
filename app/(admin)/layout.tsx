import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Trophy, Users, Star, BookOpen, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
    { href: '/dashboard', label: 'Panel', Icon: LayoutDashboard },
    { href: '/dashboard/partidos', label: 'Partidos', Icon: Trophy },
    { href: '/dashboard/plantel', label: 'Plantel', Icon: Users },
    { href: '/dashboard/goleadores', label: 'Goleadores', Icon: Star },
    { href: '/dashboard/historia', label: 'Historia', Icon: BookOpen },
];

async function cerrarSesion() {
    'use server';
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');
    redirect('/login');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-60 bg-black flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-10">
                {/* Logo */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-full bg-[#A6192E] flex items-center justify-center flex-shrink-0"
                            style={{ border: '2px solid #C9A84C' }}
                        >
                            <span className="text-base text-[#FFFEF4]" style={{ fontWeight: 900 }}>U</span>
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-white font-bold text-sm truncate">Historia Merengue</div>
                            <div className="text-gray-500 text-xs">Panel Admin</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                        >
                            <item.Icon size={16} className="flex-shrink-0" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/10">
                    <form action={cerrarSesion}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-white/10 hover:text-white transition-colors text-sm cursor-pointer"
                        >
                            <LogOut size={16} className="flex-shrink-0" />
                            Cerrar sesión
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 ml-60 min-h-screen overflow-auto">
                {children}
            </main>
        </div>
    );
}
