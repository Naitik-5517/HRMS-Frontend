/**
 * CSV Export Utility
 * Converts array of objects to CSV and downloads
 */

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains comma, quote, or newline, wrap it in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert an array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @returns {string} - CSV formatted string
 */
export function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.map(escapeCsvValue).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => escapeCsvValue(row[header])).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Download data as CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export function downloadCSV(data, filename) {
  const csvContent = convertToCSV(data);

  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

export default { convertToCSV, downloadCSV };
