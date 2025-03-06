/**
 * Utility functions for formatting values
 */

/**
 * Format a number for display (e.g. 1000 -> 1K, 1000000 -> 1M)
 * @param value The number to format
 * @param decimals Number of decimal places to show (default: 1)
 * @returns Formatted string representation of the number
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (value === undefined || value === null) return '0';
  
  // Handle edge cases
  if (value === 0) return '0';
  if (isNaN(value)) return 'NaN';
  
  // Format based on magnitude
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000000) {
    return (value / 1000000000).toFixed(decimals) + 'B';
  } 
  
  if (absValue >= 1000000) {
    return (value / 1000000).toFixed(decimals) + 'M';
  }
  
  if (absValue >= 1000) {
    return (value / 1000).toFixed(decimals) + 'K';
  }
  
  // For values under 1000, return as is
  return value.toString();
}

/**
 * Format a date for display
 * @param date Date string or Date object
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date, 
  options: { short?: boolean; includeTime?: boolean } = {}
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Short format (e.g. "Jan 1, 2023")
  if (options.short) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...(options.includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    });
    
    return formatter.format(dateObj);
  }
  
  // Long format (e.g. "January 1, 2023")
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...(options.includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
  
  return formatter.format(dateObj);
}

/**
 * Format a duration in seconds to a human-readable string (e.g. "3:45")
 * @param seconds Duration in seconds
 * @returns Formatted time string (mm:ss or hh:mm:ss)
 */
export function formatDuration(seconds: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return '0:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  // Format as mm:ss or hh:mm:ss
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
