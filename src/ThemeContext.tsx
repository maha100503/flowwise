import React, { createContext, useContext, useState } from 'react';

export type ThemeId =
    | 'dark'
    | 'light'
    | 'midnight'
    | 'sunset'
    | 'mocha'
    | 'lavender'
    | 'neoncharcoal'
    | 'tealnight';

export interface Theme {
    id: ThemeId;
    name: string;
    preview: string; // CSS color for the preview dot
    // Canvas
    canvasBg: string;
    dotColor: string;
    // Sidebar
    sidebarBg: string;
    sidebarBorder: string;
    // Node
    nodeBg: string;
    nodeBorder: string;
    nodeBorderSelected: string;
    nodeHeaderBorder: string;
    nodeText: string;
    nodeTextMuted: string;
    // Inputs
    inputBg: string;
    inputBorder: string;
    inputText: string;
    inputPlaceholder: string;
    // Panels
    panelBg: string;
    panelBorder: string;
    panelText: string;
    // Buttons
    btnBg: string;
    btnHover: string;
    // Handles
    handleBorder: string;
    // General
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    divider: string;
    // React Flow
    colorMode: 'dark' | 'light';
}

export const themes: Record<ThemeId, Theme> = {
    dark: {
        id: 'dark',
        name: 'Dark',
        preview: '#0f172a',
        canvasBg: 'bg-slate-950',
        dotColor: '#1e293b',
        sidebarBg: 'bg-slate-950/95',
        sidebarBorder: 'border-slate-800/50',
        nodeBg: 'bg-slate-900/90',
        nodeBorder: 'border-slate-700/40',
        nodeBorderSelected: 'border-white/20',
        nodeHeaderBorder: 'border-slate-700/30',
        nodeText: 'text-slate-100',
        nodeTextMuted: 'text-slate-500',
        inputBg: 'bg-slate-950/80',
        inputBorder: 'border-slate-700/50',
        inputText: 'text-slate-200',
        inputPlaceholder: 'placeholder-slate-600',
        panelBg: 'bg-slate-900/80',
        panelBorder: 'border-slate-700/40',
        panelText: 'text-slate-400',
        btnBg: 'bg-slate-800/80',
        btnHover: 'hover:bg-slate-700',
        handleBorder: '!border-slate-900',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        divider: 'bg-slate-700/50',
        colorMode: 'dark',
    },

    light: {
        id: 'light',
        name: 'Ice Blue',
        preview: '#7dd3fc',
        canvasBg: 'bg-sky-50',
        dotColor: '#366265ff',
        sidebarBg: 'bg-sky-50/95',
        sidebarBorder: 'border-sky-200/60',
        nodeBg: 'bg-sky-50',
        nodeBorder: 'border-sky-200',
        nodeBorderSelected: 'border-sky-500',
        nodeHeaderBorder: 'border-sky-100',
        nodeText: 'text-sky-950',
        nodeTextMuted: 'text-sky-600',
        inputBg: 'bg-sky-50/50',
        inputBorder: 'border-sky-200',
        inputText: 'text-sky-950',
        inputPlaceholder: 'placeholder-sky-400',
        panelBg: 'bg-white/92',
        panelBorder: 'border-sky-200',
        panelText: 'text-sky-700',
        btnBg: 'bg-sky-100',
        btnHover: 'hover:bg-sky-200',
        handleBorder: '!border-white',
        textPrimary: 'text-sky-950',
        textSecondary: 'text-sky-800',
        textMuted: 'text-sky-500',
        divider: 'bg-sky-200/60',
        colorMode: 'light',
    },

    midnight: {
        id: 'midnight',
        name: 'Midnight',
        preview: '#1e1b4b',
        canvasBg: 'bg-indigo-950',
        dotColor: '#bebdd3ff',
        sidebarBg: 'bg-indigo-950/95',
        sidebarBorder: 'border-indigo-800/50',
        nodeBg: 'bg-indigo-900/80',
        nodeBorder: 'border-indigo-700/40',
        nodeBorderSelected: 'border-violet-400/60',
        nodeHeaderBorder: 'border-indigo-700/30',
        nodeText: 'text-indigo-100',
        nodeTextMuted: 'text-indigo-400',
        inputBg: 'bg-indigo-950/80',
        inputBorder: 'border-indigo-700/50',
        inputText: 'text-indigo-100',
        inputPlaceholder: 'placeholder-indigo-600',
        panelBg: 'bg-indigo-900/80',
        panelBorder: 'border-indigo-700/40',
        panelText: 'text-indigo-300',
        btnBg: 'bg-indigo-800/80',
        btnHover: 'hover:bg-indigo-700',
        handleBorder: '!border-indigo-950',
        textPrimary: 'text-white',
        textSecondary: 'text-indigo-200',
        textMuted: 'text-indigo-500',
        divider: 'bg-indigo-700/50',
        colorMode: 'dark',
    },

    sunset: {
        id: 'sunset',
        name: 'Ember',
        preview: '#7c2d12',
        canvasBg: 'bg-orange-950',
        dotColor: '#fafa18',
        sidebarBg: 'bg-orange-950/95',
        sidebarBorder: 'border-orange-800/50',
        nodeBg: 'bg-orange-950/85',
        nodeBorder: 'border-orange-800/40',
        nodeBorderSelected: 'border-amber-400/70',
        nodeHeaderBorder: 'border-orange-800/30',
        nodeText: 'text-orange-50',
        nodeTextMuted: 'text-orange-400',
        inputBg: 'bg-orange-950/80',
        inputBorder: 'border-orange-800/50',
        inputText: 'text-orange-100',
        inputPlaceholder: 'placeholder-orange-600',
        panelBg: 'bg-orange-950/85',
        panelBorder: 'border-orange-800/40',
        panelText: 'text-orange-300',
        btnBg: 'bg-orange-900/80',
        btnHover: 'hover:bg-orange-800',
        handleBorder: '!border-orange-950',
        textPrimary: 'text-white',
        textSecondary: 'text-orange-200',
        textMuted: 'text-orange-500',
        divider: 'bg-orange-800/50',
        colorMode: 'dark',
    },

    // ── New Light Themes ────────────────────────────────────────
    mocha: {
        id: 'mocha',
        name: 'Mocha',
        preview: '#e0d2c3',
        canvasBg: 'bg-stone-50',
        dotColor: '#d4c4b5',
        sidebarBg: 'bg-amber-50/95',
        sidebarBorder: 'border-amber-200/70',
        nodeBg: 'bg-white/95',
        nodeBorder: 'border-amber-200',
        nodeBorderSelected: 'border-amber-400',
        nodeHeaderBorder: 'border-amber-100',
        nodeText: 'text-stone-900',
        nodeTextMuted: 'text-stone-600',
        inputBg: 'bg-amber-50/60',
        inputBorder: 'border-amber-200',
        inputText: 'text-stone-900',
        inputPlaceholder: 'placeholder-stone-500',
        panelBg: 'bg-white/92',
        panelBorder: 'border-amber-100',
        panelText: 'text-stone-700',
        btnBg: 'bg-amber-100',
        btnHover: 'hover:bg-amber-200',
        handleBorder: '!border-amber-50',
        textPrimary: 'text-stone-950',
        textSecondary: 'text-stone-700',
        textMuted: 'text-stone-500',
        divider: 'bg-amber-100/60',
        colorMode: 'light',
    },

    lavender: {
        id: 'lavender',
        name: 'Lavender',
        preview: '#e0d4f5',
        canvasBg: 'bg-purple-50/70',
        dotColor: '#d8cfea',
        sidebarBg: 'bg-white/96',
        sidebarBorder: 'border-purple-100',
        nodeBg: 'bg-white/94',
        nodeBorder: 'border-purple-200/80',
        nodeBorderSelected: 'border-purple-400',
        nodeHeaderBorder: 'border-purple-100/60',
        nodeText: 'text-purple-950',
        nodeTextMuted: 'text-purple-600',
        inputBg: 'bg-purple-50/50',
        inputBorder: 'border-purple-200',
        inputText: 'text-purple-950',
        inputPlaceholder: 'placeholder-purple-400',
        panelBg: 'bg-white/90',
        panelBorder: 'border-purple-100',
        panelText: 'text-purple-700',
        btnBg: 'bg-purple-100',
        btnHover: 'hover:bg-purple-200',
        handleBorder: '!border-white',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-purple-800',
        textMuted: 'text-purple-500',
        divider: 'bg-purple-100/50',
        colorMode: 'light',
    },

    // ── New Dark Themes ─────────────────────────────────────────
    neoncharcoal: {
        id: 'neoncharcoal',
        name: 'Neon Charcoal',
        preview: '#0e0e0e',
        canvasBg: 'bg-neutral-950',
        dotColor: '#1a1a1a',
        sidebarBg: 'bg-neutral-950/96',
        sidebarBorder: 'border-neutral-800/60',
        nodeBg: 'bg-neutral-900/92',
        nodeBorder: 'border-neutral-800/50',
        nodeBorderSelected: 'border-emerald-500/70',
        nodeHeaderBorder: 'border-neutral-800/40',
        nodeText: 'text-neutral-100',
        nodeTextMuted: 'text-neutral-500',
        inputBg: 'bg-neutral-900/80',
        inputBorder: 'border-neutral-700/60',
        inputText: 'text-neutral-200',
        inputPlaceholder: 'placeholder-neutral-600',
        panelBg: 'bg-neutral-900/85',
        panelBorder: 'border-neutral-800/50',
        panelText: 'text-neutral-400',
        btnBg: 'bg-neutral-800/85',
        btnHover: 'hover:bg-neutral-700',
        handleBorder: '!border-neutral-950',
        textPrimary: 'text-white',
        textSecondary: 'text-neutral-300',
        textMuted: 'text-neutral-500',
        divider: 'bg-neutral-800/60',
        colorMode: 'dark',
    },

    tealnight: {
        id: 'tealnight',
        name: 'Teal Night',
        preview: '#0f2a2a',
        canvasBg: 'bg-teal-950',
        dotColor: '#1e3a3a',
        sidebarBg: 'bg-teal-950/95',
        sidebarBorder: 'border-teal-900/60',
        nodeBg: 'bg-teal-950/88',
        nodeBorder: 'border-teal-800/50',
        nodeBorderSelected: 'border-teal-400/70',
        nodeHeaderBorder: 'border-teal-900/40',
        nodeText: 'text-teal-50',
        nodeTextMuted: 'text-teal-400',
        inputBg: 'bg-teal-950/80',
        inputBorder: 'border-teal-800/60',
        inputText: 'text-teal-100',
        inputPlaceholder: 'placeholder-teal-600',
        panelBg: 'bg-teal-950/85',
        panelBorder: 'border-teal-900/50',
        panelText: 'text-teal-300',
        btnBg: 'bg-teal-900/80',
        btnHover: 'hover:bg-teal-800',
        handleBorder: '!border-teal-950',
        textPrimary: 'text-white',
        textSecondary: 'text-teal-200',
        textMuted: 'text-teal-500',
        divider: 'bg-teal-900/50',
        colorMode: 'dark',
    },
};

interface ThemeContextType {
    theme: Theme;
    themeId: ThemeId;
    setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: themes.dark,
    themeId: 'dark',
    setThemeId: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeId, setThemeId] = useState<ThemeId>('dark');
    const theme = themes[themeId];

    return (
        <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

