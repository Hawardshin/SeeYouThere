'use client';

import { useState } from 'react';
import { CandidateLocation } from '@/types';

export function useCandidates() {
  const [candidates, setCandidates] = useState<CandidateLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const addCandidate = (candidate: CandidateLocation) => {
    setCandidates(prev => [...prev, candidate]);
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    if (selectedLocationId === id) {
      setSelectedLocationId(null);
    }
  };

  const updateCandidate = (id: string, updates: Partial<CandidateLocation>) => {
    setCandidates(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const clearCandidates = () => {
    setCandidates([]);
    setSelectedLocationId(null);
  };

  return {
    // State
    candidates,
    selectedLocationId,
    
    // Setters
    setCandidates,
    setSelectedLocationId,
    
    // Actions
    addCandidate,
    removeCandidate,
    updateCandidate,
    clearCandidates,
  };
}
