import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

interface ThemeToggleProps {
    showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = true }) => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                return savedTheme === 'dark';
            }
            return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <div className={clsx('flex items-center space-x-3', showLabel ? 'justify-end w-full' : 'justify-center')}>
            {showLabel && <span className="text-xs font-medium text-gray-400 whitespace-nowrap transition-opacity duration-300">{isDark ? '暗黑模式' : '明亮模式'}</span>}
            <button
                onClick={() => setIsDark(!isDark)}
                className={clsx('p-2 rounded-lg transition-all duration-300 focus:outline-none', 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700')}
                aria-label="Toggle Dark Mode"
            >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-400" />}
            </button>
        </div>
    );
};

export default ThemeToggle;
