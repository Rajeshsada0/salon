import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-black bg-gradient-to-r from-violet-100 to-indigo-200 bg-clip-text text-transparent">
                    Aura Salon Suite
                </span>
                <span className="text-3xs font-semibold tracking-wider uppercase text-neutral-400">
                    Operations Live
                </span>
            </div>
        </>
    );
}
