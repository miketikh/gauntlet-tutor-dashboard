import { formatDistanceToNow, format } from "date-fns"

/**
 * Format a score to one decimal place (e.g., 8.5, 7.2)
 * @param score - The score to format (0-10 scale)
 * @returns Formatted score string
 */
export function formatScore(score: number): string {
  return score.toFixed(1)
}

/**
 * Format a number as a percentage
 * @param value - The value to format (0-1 for decimal, 0-100 for percentage)
 * @param precision - Number of decimal places (default: 0)
 * @param isDecimal - Whether the input is decimal (0-1) or percentage (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  precision: number = 0,
  isDecimal: boolean = true
): string {
  const percentage = isDecimal ? value * 100 : value
  return `${percentage.toFixed(precision)}%`
}

/**
 * Format a duration in minutes to human-readable format (e.g., "1h 30m", "45m")
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

/**
 * Format a date as a readable string (e.g., "Jan 15, 2024")
 * @param date - The date to format
 * @param formatString - date-fns format string (default: "MMM d, yyyy")
 * @returns Formatted date string
 */
export function formatDate(date: Date, formatString: string = "MMM d, yyyy"): string {
  return format(date, formatString)
}

/**
 * Format a date and time as a readable string (e.g., "Jan 15, 2024 at 3:30 PM")
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date): string {
  return format(date, "MMM d, yyyy 'at' h:mm a")
}

/**
 * Format a number with thousand separators (e.g., "1,234,567")
 * @param value - The number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

/**
 * Format a currency value (e.g., "$1,234.56")
 * @param value - The amount to format
 * @param currency - Currency code (default: "USD")
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value)
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return `${str.slice(0, maxLength - 3)}...`
}

/**
 * Format a phone number (simple US format)
 * @param phone - Phone number string (digits only)
 * @returns Formatted phone string
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  return phone
}
