import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

const PitchingCalculator: React.FC = () => {
    const [mph, setMph] = useState<string>('');
    const [kph, setKph] = useState<string>('');
    const [activeField, setActiveField] = useState<'mph' | 'kph'>('kph');

    const updateKphFromMph = (mphVal: string) => {
        if (mphVal === '') {
            setKph('');
        } else {
            setKph((parseFloat(mphVal) * 1.60934).toFixed(1));
        }
    };

    const updateMphFromKph = (kphVal: string) => {
        if (kphVal === '') {
            setMph('');
        } else {
            setMph((parseFloat(kphVal) / 1.60934).toFixed(1));
        }
    };

    const handleMphChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMph(val);
        updateKphFromMph(val);
    };

    const handleKphChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setKph(val);
        updateMphFromKph(val);
    };

    const adjustSpeed = (amount: number) => {
        if (activeField === 'mph') {
            const current = parseFloat(mph) || 0;
            const newVal = Math.max(0, current + amount).toString();
            setMph(newVal);
            updateKphFromMph(newVal);
        } else {
            const current = parseFloat(kph) || 0;
            const newVal = Math.max(0, current + amount).toString();
            setKph(newVal);
            updateMphFromKph(newVal);
        }
    };

    const presetSpeeds = [
        { value: 145, unit: 'km/h' },
        { value: 150, unit: 'km/h' },
        { value: 155, unit: 'km/h' },
        { value: 90, unit: 'mph' },
        { value: 95, unit: 'mph' },
        { value: 100, unit: 'mph' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto transition-colors duration-300">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">公里-英里換算</h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="w-full text-center">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">公里 (KPH)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={kph}
                            onChange={handleKphChange}
                            onFocus={() => setActiveField('kph')}
                            className={`w-full p-4 border bg-white dark:bg-gray-900 text-3xl font-bold text-blue-600 dark:text-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500 ${
                                activeField === 'kph' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">km/h</span>
                    </div>
                </div>

                <div className="text-gray-400 dark:text-gray-500 rotate-90 md:rotate-0">
                    <ArrowRightLeft size={32} />
                </div>

                <div className="w-full text-center">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">英里 (MPH)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={mph}
                            onChange={handleMphChange}
                            onFocus={() => setActiveField('mph')}
                            className={`w-full p-4 border bg-white dark:bg-gray-900 text-3xl font-bold text-red-600 dark:text-red-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500 ${
                                activeField === 'mph' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">mph</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-6">
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => adjustSpeed(-1)}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
                    >
                        -1 {activeField.toUpperCase()}
                    </button>
                    <button
                        onClick={() => adjustSpeed(1)}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
                    >
                        +1 {activeField.toUpperCase()}
                    </button>
                </div>

                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">常見球速參考</p>
                    <div className="flex justify-center flex-wrap gap-2">
                        {presetSpeeds.map((preset) => {
                            const isKph = preset.unit === 'km/h';
                            return (
                                <button
                                    key={`${preset.value}-${preset.unit}`}
                                    onClick={() => {
                                        const val = preset.value.toString();
                                        if (isKph) {
                                            setKph(val);
                                            updateMphFromKph(val);
                                            setActiveField('kph');
                                        } else {
                                            setMph(val);
                                            updateKphFromMph(val);
                                            setActiveField('mph');
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                                        isKph
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800'
                                            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800'
                                    }`}
                                >
                                    {preset.value} {preset.unit}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PitchingCalculator;
