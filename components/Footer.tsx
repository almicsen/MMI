'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    // Update year on client side to ensure consistency
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>© {year} MobileMediaInteractions. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

