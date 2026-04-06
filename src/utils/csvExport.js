/**
 * CSV Export Utility
 * Converts JSON data to CSV format and triggers download
 */

/**
 * Converts an array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @returns {string} CSV formatted string
 */
export const jsonToCSV = (data) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Create CSV header row
  const headerRow = headers.map(escapeCSVValue).join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return headers.map(header => escapeCSVValue(row[header])).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Downloads a CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Name of the file to download (should include .csv extension)
 */
export const downloadCSV = (csvContent, filename) => {
  // Ensure filename has .csv extension
  const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  
  // Create a Blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', csvFilename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Exports JSON data to CSV file (combines jsonToCSV and downloadCSV)
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file to download
 * @returns {boolean} Success status
 */
export const exportToCSV = (data, filename) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }
    
    const csvContent = jsonToCSV(data);
    downloadCSV(csvContent, filename);
    
    return true;
  } catch (error) {
    console.error('CSV Export Error:', error);
    return false;
  }
};
