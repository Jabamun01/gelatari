import React, { useEffect, useRef } from 'react';
import { useTimers } from '../../contexts/TimerContext';

const AlarmSoundHandler: React.FC = () => {
  const { state: { timers } } = useTimers();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const shouldAlarmBePlaying = timers.some(timer => timer.alarmPlaying);
    
    if (!audioRef.current) return;

    if (shouldAlarmBePlaying) {
      if (audioRef.current.paused || !audioRef.current.src) {
        audioRef.current.src = '/sounds/alarm.mp3';
        audioRef.current.loop = true;
        audioRef.current.play().catch(error => {
          console.error('Error en reproduir el so:', error);
        });
      }
    } else {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [timers]);

  return <audio ref={audioRef} preload="auto" />;
};

export default AlarmSoundHandler;