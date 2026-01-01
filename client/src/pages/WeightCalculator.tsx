import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

const WeightCalculator: React.FC = () => {
    const [kg, setKg] = useState<string>('');
    const [lb, setLb] = useState<string>('');
    const [activeField, setActiveField] = useState<'kg' | 'lb'>('lb');

    const updateLbFromKg = (kgVal: string) => {
        if (kgVal === '') {
            setLb('');
        } else {
            setLb((parseFloat(kgVal) * 2.20462).toFixed(2));
        }
    };

    const updateKgFromLb = (lbVal: string) => {
        if (lbVal === '') {
            setKg('');
        } else {
            setKg((parseFloat(lbVal) / 2.20462).toFixed(2));
        }
    };

    const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setKg(val);
        updateLbFromKg(val);
    };

    const handleLbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLb(val);
        updateKgFromLb(val);
    };

    const adjustWeight = (amount: number) => {
        if (activeField === 'kg') {
            const currentKg = parseFloat(kg) || 0;
            const newKg = Math.max(0, currentKg + amount).toString();
            setKg(newKg);
            updateLbFromKg(newKg);
        } else {
            const currentLb = parseFloat(lb) || 0;
            const newLb = Math.max(0, currentLb + amount).toString();
            setLb(newLb);
            updateKgFromLb(newLb);
        }
    };

    const presets = {
        kg: [10, 20, 30, 40],
        lb: [15, 20, 25, 30],
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto transition-colors duration-300">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">磅-公斤換算</h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">磅 (LB)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={lb}
                            onChange={handleLbChange}
                            onFocus={() => setActiveField('lb')}
                            className={`w-full p-4 pr-12 border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-xl font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500 ${
                                activeField === 'lb' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-sm text-gray-500 dark:text-gray-400">lb</div>
                    </div>
                </div>

                <div className="text-gray-400 dark:text-gray-500 rotate-90 md:rotate-0">
                    <ArrowRightLeft size={32} />
                </div>

                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">公斤 (KG)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={kg}
                            onChange={handleKgChange}
                            onFocus={() => setActiveField('kg')}
                            className={`w-full p-4 pr-12 border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-xl font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500 ${
                                activeField === 'kg' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-sm text-gray-500 dark:text-gray-400">kg</div>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => adjustWeight(-5)}
                        className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-800 transition-colors shadow-sm"
                    >
                        -5 {activeField.toUpperCase()}
                    </button>
                    <button
                        onClick={() => adjustWeight(5)}
                        className="px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold hover:bg-green-200 dark:hover:bg-green-800 transition-colors shadow-sm"
                    >
                        +5 {activeField.toUpperCase()}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {presets[activeField].map((weight) => (
                        <button
                            key={weight}
                            onClick={() => {
                                const val = weight.toString();
                                if (activeField === 'kg') {
                                    setKg(val);
                                    updateLbFromKg(val);
                                } else {
                                    setLb(val);
                                    updateKgFromLb(val);
                                }
                            }}
                            className="py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                            快速填入 {weight}
                            {activeField}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeightCalculator;
