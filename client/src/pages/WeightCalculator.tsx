import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

const WeightCalculator: React.FC = () => {
  const [kg, setKg] = useState<string>('');
  const [lb, setLb] = useState<string>('');

  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKg(val);
    if (val === '') {
      setLb('');
    } else {
      setLb((parseFloat(val) * 2.20462).toFixed(2));
    }
  };

  const handleLbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLb(val);
    if (val === '') {
      setKg('');
    } else {
      setKg((parseFloat(val) / 2.20462).toFixed(2));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">重量換算計算機</h2>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">公斤 (KG)</label>
          <input
            type="number"
            value={kg}
            onChange={handleKgChange}
            className="w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-xl font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="0"
          />
        </div>

        <div className="text-gray-400 dark:text-gray-500 rotate-90 md:rotate-0">
          <ArrowRightLeft size={32} />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">磅 (LB)</label>
          <input
            type="number"
            value={lb}
            onChange={handleLbChange}
            className="w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-xl font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-center placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="0"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {[20, 60, 100, 200].map((weight) => (
            <button
                key={weight}
                onClick={() => {
                    const val = weight.toString();
                    setKg(val);
                    setLb((parseFloat(val) * 2.20462).toFixed(2));
                }}
                className="py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
                快速填入 {weight}kg
            </button>
        ))}
      </div>
    </div>
  );
};

export default WeightCalculator;
