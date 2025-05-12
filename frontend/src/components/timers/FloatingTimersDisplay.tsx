import React from 'react';
import { useTimers } from '../../contexts/TimerContext';
import { IndividualFloatingTimer } from './IndividualFloatingTimer';

export const FloatingTimersDisplay: React.FC = () => {
  const { state } = useTimers();
  const { timers } = state;

  const sortedTimers = [...timers].sort((a, b) => b.createdAt - a.createdAt);

  return sortedTimers.map((timer) => (
    <IndividualFloatingTimer key={timer.id} timer={timer} />
  ));
};