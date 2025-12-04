/**
 * Token Balance Display Component
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTokens } from '@/lib/tokens/tokenSystem';
import { MMIToken } from '@/lib/firebase/types';

export default function TokenBalance() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<MMIToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTokens();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadTokens = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const tokenData = await getUserTokens(user.uid);
      setTokens(tokenData);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
      <span className="text-lg">🪙</span>
      <span className="font-semibold text-yellow-400">
        {tokens?.balance || 0}
      </span>
    </div>
  );
}

