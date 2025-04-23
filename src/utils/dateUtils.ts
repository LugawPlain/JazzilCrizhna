/**
 * Helper function to format a raw date string (ISO, M/D/Y, M/D/Y - M/D/Y, or null)
 * into a user-friendly display string (M/D/YYYY or M/D/YYYY - M/D/YYYY).
 *
 * @param rawDate The raw date string from the data source.
 * @returns A formatted date string for display, or "N/A".
 */
export function formatDisplayDate(rawDate: string | null | undefined): string {
  if (!rawDate) return "N/A";

  const trimmedDate = rawDate.trim();

  // Check if it's already in a simple date or range format we want to keep
  const simpleDateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  const simpleRangeRegex =
    /^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (simpleDateRegex.test(trimmedDate) || simpleRangeRegex.test(trimmedDate)) {
    return trimmedDate; // Return as is if it matches the desired simple formats
  }

  // Attempt to parse as an ISO date or other recognizable single date format
  const dateObj = new Date(trimmedDate);
  if (!isNaN(dateObj.getTime())) {
    // Format as M/D/YYYY using local time zone
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  }

  // Handle potential ranges separated by ' - ' that weren't caught by simpleRangeRegex
  if (trimmedDate.includes(" - ")) {
    const parts = trimmedDate.split(" - ").map((part) => part.trim());
    if (parts.length === 2) {
      const startDate = new Date(parts[0]);
      const endDate = new Date(parts[1]);
      // Check if both parts are valid dates
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        // Format both dates and join them
        const startFormatted = startDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        });
        const endFormatted = endDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        });
        return `${startFormatted} - ${endFormatted}`;
      }
    }
  }

  // Fallback: If it's not a recognized format, return the original string or N/A
  console.warn(
    `[formatDisplayDate] Unrecognized date format: ${trimmedDate}. Returning original.`
  );
  return trimmedDate || "N/A";
}

/**
 * Extracts the end date from a date string, which might be a single date or a range.
 * Used primarily for sorting purposes to get the most recent point in time.
 *
 * @param dateString The date string (e.g., "MM/DD/YYYY", "MM/DD/YYYY - MM/DD/YYYY", ISO string).
 * @returns A Date object representing the end date, or null if parsing fails.
 */
export const getEndDateFromRange = (
  dateString: string | null | undefined
): Date | null => {
  if (!dateString) return null;

  const trimmedDateString = dateString.trim();

  // Check if it's a range (contains ' - ')
  if (trimmedDateString.includes(" - ")) {
    // Extract the end date part (after the hyphen)
    const endDateStr = trimmedDateString.split(" - ")[1]?.trim();
    if (endDateStr) {
      const endDate = new Date(endDateStr);
      // Basic validation for common invalid date strings from Date constructor
      if (!isNaN(endDate.getTime()) && endDate.getFullYear() > 1900) {
        return endDate;
      }
    }
    // If range parsing fails, fall through to single date parsing
  }

  // Attempt to parse the entire string as a single date
  const date = new Date(trimmedDateString);
  // Basic validation
  if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
    return date;
  }

  // Log warning if parsing fails completely
  console.warn(
    `[getEndDateFromRange] Could not parse date string: ${trimmedDateString}`
  );
  return null;
};
