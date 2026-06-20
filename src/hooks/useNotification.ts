import { useEffect, useRef, useCallback } from 'react';
import { DailyReminder } from '@/types';

interface UseNotificationReturn {
  requestPermission: () => Promise<NotificationPermission>;
  checkPermission: () => boolean;
  triggerReminder: (reminder: DailyReminder) => void;
}

export function useNotification(reminders: DailyReminder[], onTrigger?: (reminder: DailyReminder) => void): UseNotificationReturn {
  const triggeredRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<number | null>(null);

  const checkPermission = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied' as NotificationPermission;
    }
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }
    return await Notification.requestPermission();
  }, []);

  const triggerReminder = useCallback((reminder: DailyReminder) => {
    if (typeof window === 'undefined') return;

    if (checkPermission()) {
      try {
        new Notification('红绿灯等待记录提醒', {
          body: reminder.label,
          icon: '/favicon.svg',
          tag: reminder.id,
        });
      } catch (e) {
        console.error('Notification error:', e);
      }
    }

    if (reminder.vibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    onTrigger?.(reminder);
  }, [checkPermission, onTrigger]);

  const checkReminders = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const dateKey = now.toDateString();

    reminders.forEach((reminder) => {
      if (!reminder.enabled) return;

      const triggerKey = `${dateKey}-${reminder.id}`;
      if (triggeredRef.current.has(triggerKey)) return;

      if (reminder.hour === currentHour && reminder.minute === currentMinute) {
        triggeredRef.current.add(triggerKey);
        triggerReminder(reminder);
      }
    });

    const newDateKey = new Date().toDateString();
    if (newDateKey !== dateKey) {
      triggeredRef.current.clear();
    }
  }, [reminders, triggerReminder]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    intervalRef.current = window.setInterval(checkReminders, 10000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkReminders]);

  return {
    requestPermission,
    checkPermission,
    triggerReminder,
  };
}
