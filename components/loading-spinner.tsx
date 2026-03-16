type LoadingSpinnerProps = {
    label?: string;
};

export default function LoadingSpinner({ label = 'Cargando' }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#A6192E]"
                aria-hidden="true"
            />
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}
