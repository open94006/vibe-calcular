import React, { useState } from 'react';

const RunningCalculator: React.FC = () => {
    const [distance, setDistance] = useState<string>('');
    const [hours, setHours] = useState<string>('');
    const [minutes, setMinutes] = useState<string>('');
    const [seconds, setSeconds] = useState<string>('');
    const [paceMinutes, setPaceMinutes] = useState<string>('');
    const [paceSeconds, setPaceSeconds] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [mode, setMode] = useState<'calcPace' | 'calcTime'>('calcPace');

    const calculate = () => {
        const dist = parseFloat(distance);
        if (!dist || dist <= 0) return;

        if (mode === 'calcPace') {
            const h = parseFloat(hours) || 0;
            const m = parseFloat(minutes) || 0;
            const s = parseFloat(seconds) || 0;
            const totalMinutes = h * 60 + m + s / 60;

            if (totalMinutes <= 0) return;

            const pM = Math.floor(totalMinutes / dist);
            const pS = Math.round((totalMinutes / dist - pM) * 60);
            setResult(`平均配速: ${pM}'${pS.toString().padStart(2, '0')}" / km`);
        } else {
            const pM = parseFloat(paceMinutes) || 0;
            const pS = parseFloat(paceSeconds) || 0;
            const paceInMinutes = pM + pS / 60;

            if (paceInMinutes <= 0) return;

            const totalMinutes = paceInMinutes * dist;
            const h = Math.floor(totalMinutes / 60);
            const m = Math.floor(totalMinutes % 60);
            const s = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);

            setResult(`完成時間: ${h}小時 ${m}分 ${s}秒`);
        }
    };

    const presetDistances = [
        { label: '5K', value: 5 },
        { label: '10K', value: 10 },
        { label: '半馬', value: 21.0975 },
        { label: '全馬', value: 42.195 },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-lg mx-auto transition-colors duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">馬拉松配速換算</h2>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => {
                            setMode('calcPace');
                            setResult('');
                        }}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${
                            mode === 'calcPace' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        算配速
                    </button>
                    <button
                        onClick={() => {
                            setMode('calcTime');
                            setResult('');
                        }}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${
                            mode === 'calcTime' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        算時間
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">距離 (公里)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {presetDistances.map((d) => (
                            <button
                                key={d.label}
                                onClick={() => setDistance(d.value.toString())}
                                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="輸入距離"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">km</div>
                    </div>
                </div>

                {mode === 'calcPace' ? (
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">時</label>
                            <input
                                type="number"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分</label>
                            <input
                                type="number"
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">秒</label>
                            <input
                                type="number"
                                value={seconds}
                                onChange={(e) => setSeconds(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">配速 (分)</label>
                            <input
                                type="number"
                                value={paceMinutes}
                                onChange={(e) => setPaceMinutes(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="分/km"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">配速 (秒)</label>
                            <input
                                type="number"
                                value={paceSeconds}
                                onChange={(e) => setPaceSeconds(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="秒"
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={calculate}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md active:transform active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                    {mode === 'calcPace' ? '計算配速' : '計算完成時間'}
                </button>

                {result && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center animate-fade-in">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RunningCalculator;
