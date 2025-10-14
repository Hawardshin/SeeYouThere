'use client';

import { useState } from 'react';
import { Participant } from '@/types';

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  const addParticipant = (participant: Participant) => {
    setParticipants(prev => [...prev, participant]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };

  const clearParticipants = () => {
    setParticipants([]);
  };

  return {
    // State
    participants,
    
    // Setters
    setParticipants,
    
    // Actions
    addParticipant,
    removeParticipant,
    updateParticipant,
    clearParticipants,
  };
}
