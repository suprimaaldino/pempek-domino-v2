'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useUtils';
import { useEffect, useState } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  className?: string;
  id?: string;
}

export function SearchInput({ placeholder = 'Cari...', onSearch, className, id }: SearchInputProps) {
  const [value, setValue] = useState('');
  const debounced = useDebounce(value, 300);

  useEffect(() => {
    onSearch(debounced);
  }, [debounced, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40 pointer-events-none" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'w-full rounded-input border border-brown/20 bg-white',
          'pl-10 pr-10 py-2.5 text-brown text-sm',
          'placeholder:text-brown/40',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
          'transition-all duration-150'
        )}
      />
      {value && (
        <button
          onClick={() => setValue('')}
          aria-label="Hapus pencarian"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brown/40 hover:text-brown/70 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
