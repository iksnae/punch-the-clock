import { TimeCalculations } from '../../src/utils/timeCalculations';

describe('TimeCalculations', () => {
  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(TimeCalculations.formatDuration(0)).toBe('0s');
      expect(TimeCalculations.formatDuration(30)).toBe('30s');
      expect(TimeCalculations.formatDuration(59)).toBe('59s');
    });

    it('should format minutes correctly', () => {
      expect(TimeCalculations.formatDuration(60)).toBe('1m');
      expect(TimeCalculations.formatDuration(90)).toBe('1m 30s');
      expect(TimeCalculations.formatDuration(120)).toBe('2m');
      expect(TimeCalculations.formatDuration(150)).toBe('2m 30s');
    });

    it('should format hours correctly', () => {
      expect(TimeCalculations.formatDuration(3600)).toBe('1h');
      expect(TimeCalculations.formatDuration(3660)).toBe('1h 1m');
      expect(TimeCalculations.formatDuration(3690)).toBe('1h 1m 30s');
      expect(TimeCalculations.formatDuration(7200)).toBe('2h');
      expect(TimeCalculations.formatDuration(7260)).toBe('2h 1m');
    });

    it('should format days correctly', () => {
      expect(TimeCalculations.formatDuration(86400)).toBe('1d');
      expect(TimeCalculations.formatDuration(90000)).toBe('1d 1h');
      expect(TimeCalculations.formatDuration(90060)).toBe('1d 1h 1m');
      expect(TimeCalculations.formatDuration(90090)).toBe('1d 1h 1m 30s');
      expect(TimeCalculations.formatDuration(172800)).toBe('2d');
    });

    it('should handle large durations', () => {
      expect(TimeCalculations.formatDuration(2592000)).toBe('30d'); // 30 days
      expect(TimeCalculations.formatDuration(31536000)).toBe('365d'); // 1 year
    });
  });

  describe('parseDuration', () => {
    it('should parse seconds correctly', () => {
      expect(TimeCalculations.parseDuration('30s')).toBe(30);
      expect(TimeCalculations.parseDuration('59s')).toBe(59);
    });

    it('should parse minutes correctly', () => {
      expect(TimeCalculations.parseDuration('1m')).toBe(60);
      expect(TimeCalculations.parseDuration('2m')).toBe(120);
      expect(TimeCalculations.parseDuration('1m 30s')).toBe(90);
    });

    it('should parse hours correctly', () => {
      expect(TimeCalculations.parseDuration('1h')).toBe(3600);
      expect(TimeCalculations.parseDuration('2h')).toBe(7200);
      expect(TimeCalculations.parseDuration('1h 30m')).toBe(5400);
      expect(TimeCalculations.parseDuration('1h 30m 45s')).toBe(5445);
    });

    it('should parse days correctly', () => {
      expect(TimeCalculations.parseDuration('1d')).toBe(86400);
      expect(TimeCalculations.parseDuration('2d')).toBe(172800);
      expect(TimeCalculations.parseDuration('1d 2h')).toBe(93600);
      expect(TimeCalculations.parseDuration('1d 2h 30m')).toBe(95400);
      expect(TimeCalculations.parseDuration('1d 2h 30m 45s')).toBe(95445);
    });

    it('should handle complex durations', () => {
      expect(TimeCalculations.parseDuration('2d 3h 45m 30s')).toBe(200730);
    });

    it('should return 0 for invalid input', () => {
      expect(TimeCalculations.parseDuration('invalid')).toBe(0);
      expect(TimeCalculations.parseDuration('')).toBe(0);
      expect(TimeCalculations.parseDuration('abc')).toBe(0);
    });
  });

  describe('getDateString', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-01-15T10:30:00Z');
      const result = TimeCalculations.getDateString(date);
      expect(result).toMatch(/2023-01-15/);
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2023-12-31T23:59:59Z');
      const result1 = TimeCalculations.getDateString(date1);
      expect(result1).toMatch(/2023-12-31/);

      const date2 = new Date('2024-02-29T12:00:00Z');
      const result2 = TimeCalculations.getDateString(date2);
      expect(result2).toMatch(/2024-02-29/);
    });
  });

  describe('getTimeOfDay', () => {
    it('should format time correctly', () => {
      const date = new Date('2023-01-15T10:30:00Z');
      const result = TimeCalculations.getTimeOfDay(date);
      expect(result).toMatch(/10:30/);
    });

    it('should handle different times', () => {
      const date1 = new Date('2023-01-15T00:00:00Z');
      const result1 = TimeCalculations.getTimeOfDay(date1);
      expect(result1).toMatch(/00:00/);

      const date2 = new Date('2023-01-15T23:59:59Z');
      const result2 = TimeCalculations.getTimeOfDay(date2);
      expect(result2).toMatch(/23:59/);
    });
  });

  describe('getRelativeTime', () => {
    it('should show relative time for recent dates', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const result = TimeCalculations.getRelativeTime(oneMinuteAgo);
      expect(result).toContain('minute');
    });

    it('should show relative time for hours', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const result = TimeCalculations.getRelativeTime(oneHourAgo);
      expect(result).toContain('hour');
    });

    it('should show relative time for days', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = TimeCalculations.getRelativeTime(oneDayAgo);
      expect(result).toContain('day');
    });

    it('should show relative time for weeks', () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const result = TimeCalculations.getRelativeTime(oneWeekAgo);
      expect(result).toContain('week');
    });

    it('should show relative time for months', () => {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const result = TimeCalculations.getRelativeTime(oneMonthAgo);
      expect(result).toContain('month');
    });

    it('should show relative time for years', () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const result = TimeCalculations.getRelativeTime(oneYearAgo);
      expect(result).toContain('year');
    });
  });

  describe('formatTimeEstimate', () => {
    it('should format time estimates correctly', () => {
      expect(TimeCalculations.formatTimeEstimate(0)).toBe('0s');
      expect(TimeCalculations.formatTimeEstimate(30)).toBe('30s');
      expect(TimeCalculations.formatTimeEstimate(60)).toBe('1m');
      expect(TimeCalculations.formatTimeEstimate(90)).toBe('1m 30s');
      expect(TimeCalculations.formatTimeEstimate(3600)).toBe('1h');
      expect(TimeCalculations.formatTimeEstimate(3660)).toBe('1h 1m');
      expect(TimeCalculations.formatTimeEstimate(3690)).toBe('1h 1m 30s');
    });

    it('should handle large time estimates', () => {
      expect(TimeCalculations.formatTimeEstimate(86400)).toBe('1d');
      expect(TimeCalculations.formatTimeEstimate(90000)).toBe('1d 1h');
      expect(TimeCalculations.formatTimeEstimate(90060)).toBe('1d 1h 1m');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration between two dates', () => {
      const start = new Date('2023-01-15T10:00:00Z');
      const end = new Date('2023-01-15T12:30:00Z');
      const result = TimeCalculations.calculateDuration(start, end);
      expect(result).toBe(9000); // 2.5 hours in seconds
    });

    it('should handle same start and end time', () => {
      const date = new Date('2023-01-15T10:00:00Z');
      const result = TimeCalculations.calculateDuration(date, date);
      expect(result).toBe(0);
    });

    it('should handle end time before start time', () => {
      const start = new Date('2023-01-15T12:00:00Z');
      const end = new Date('2023-01-15T10:00:00Z');
      const result = TimeCalculations.calculateDuration(start, end);
      expect(result).toBe(-7200); // Negative duration
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      const result = TimeCalculations.isToday(today);
      expect(result).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = TimeCalculations.isToday(yesterday);
      expect(result).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = TimeCalculations.isToday(tomorrow);
      expect(result).toBe(false);
    });
  });
});