export interface FloatingTimer {
  id: string; // Unique identifier for the timer
  duration: number; // Total duration in seconds
  elapsedTime: number; // Elapsed time in seconds
  isRunning: boolean; // Whether timer is currently running
  isFinished: boolean; // True when elapsedTime >= duration
  color: string; // Hex code or CSS variable name for the timer's theme color
  alarmPlaying: boolean; // True if the alarm for this timer is currently active
  createdAt: number; // Timestamp for sorting/ordering
  x: number; // x-coordinate for positioning
  y: number; // y-coordinate for positioning
  hasBeenMoved: boolean; // True if timer has been manually dragged
  lastSavedAt?: number; // Timestamp for persistence calculation
}