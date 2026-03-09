'use client';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = '搜索技能...' }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={placeholder}
          className="w-full px-6 py-4 bg-white/20 border-gray-600/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 placeholder-gray-500 text-lg transition-all duration-300 hover:shadow-lg"
        />
        <div className="absolute right-4 top-1/2">
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:scale transition-all duration-300 hover:shadow-lg active:scale"
          >
            <span className="flex items-center gap-2">
              🔍 搜索
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
