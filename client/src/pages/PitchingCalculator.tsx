import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

const PitchingCalculator: React.FC = () => {
  const [mph, setMph] = useState<string>('');
  const [kph, setKph] = useState<string>('');

  const handleMphChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMph(val);
    if (val === '') {
      setKph('');
    } else {
      setKph((parseFloat(val) * 1.60934).toFixed(1));
    }
  };

  const handleKphChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKph(val);
    if (val === '') {
      setMph('');
    } else {
      setMph((parseFloat(val) / 1.60934).toFixed(1));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">球速換算計算機</h2>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full text-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">英里 (MPH)</label>
          <div className="relative">
            <input
              type="number"
              value={mph}
              onChange={handleMphChange}
              className="w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-3xl font-bold text-red-600 dark:text-red-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">mph</span>
          </div>
        </div>

        <div className="text-gray-400 dark:text-gray-500 rotate-90 md:rotate-0">
          <ArrowRightLeft size={32} />
        </div>

        <div className="w-full text-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">公里 (KPH)</label>
          <div className="relative">
            <input
              type="number"
              value={kph}
              onChange={handleKphChange}
              className="w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-3xl font-bold text-blue-600 dark:text-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">km/h</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">常見球速參考</p>
        <div className="flex justify-center flex-wrap gap-2">
            {[90, 95, 100, 105].map((speed) => (
                <button
                    key={speed}
                    onClick={() => {
                        const val = speed.toString();
                        setMph(val);
                        setKph((parseFloat(val) * 1.60934).toFixed(1));
                    }}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-800 font-medium transition-colors"
                >
                    {speed} mph
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PitchingCalculator;
