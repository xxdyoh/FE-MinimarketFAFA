// layouts/composables/layout.js
import { computed, reactive, readonly } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    darkTheme: false,
    menuMode: 'horizontal'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null
});

export function useLayout() {
    // ✅ DEFINISIKAN resetMenu DI ATAS, sebelum dipakai
    const resetMenu = () => {
        layoutState.overlayMenuActive = false;
        layoutState.staticMenuMobileActive = false;
        layoutState.menuHoverActive = false;
    };

    // ✅ Baru definisikan detectDevice setelah resetMenu tersedia
    const detectDevice = () => {
        if (typeof window === 'undefined') return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortrait = height > width;
        const isTablet = width >= 768 && width < 992;
        const isMobile = width < 768;

        if (isMobile) {
            layoutConfig.menuMode = 'overlay';
        } else if (isTablet && isPortrait) {
            layoutConfig.menuMode = 'overlay';
        } else {
            layoutConfig.menuMode = 'horizontal';
        }

        resetMenu(); // ✅ Sekarang aman
    };

    // Init & listeners
    if (typeof window !== 'undefined') {
        detectDevice();
        window.addEventListener('resize', detectDevice);
        window.addEventListener('orientationchange', () => {
            setTimeout(detectDevice, 100);
        });
    }

    const setPrimary = (value) => {
        layoutConfig.primary = value;
    };

    const setSurface = (value) => {
        layoutConfig.surface = value;
    };

    const setPreset = (value) => {
        layoutConfig.preset = value;
    };

    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = item.value || item;
    };

    const setMenuMode = (mode) => {
        layoutConfig.menuMode = mode;
    };

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();
            return;
        }
        document.startViewTransition(() => executeDarkModeToggle());
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        document.documentElement.classList.toggle('app-dark');
    };

    const onMenuToggle = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        } else if (layoutConfig.menuMode === 'static') {
            if (window.innerWidth > 991) {
                layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
            } else {
                layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
            }
        }
    };

    const isSidebarActive = computed(() =>
        layoutState.overlayMenuActive || layoutState.staticMenuMobileActive
    );

    const isDarkTheme = computed(() => layoutConfig.darkTheme);
    const getPrimary = computed(() => layoutConfig.primary);
    const getSurface = computed(() => layoutConfig.surface);

    return {
        layoutConfig: readonly(layoutConfig),
        layoutState: readonly(layoutState),
        onMenuToggle,
        isSidebarActive,
        isDarkTheme,
        getPrimary,
        getSurface,
        setActiveMenuItem,
        toggleDarkMode,
        setPrimary,
        setSurface,
        setPreset,
        resetMenu,
        setMenuMode
    };
}