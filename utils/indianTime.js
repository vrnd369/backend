// Utility function to format Indian time consistently
function getIndianTime(date = new Date()) {
  return date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Function to get current Indian time
function getCurrentIndianTime() {
  return getIndianTime(new Date());
}

// Function to format date for display
function formatIndianDate(date = new Date()) {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

// Function to format time for display
function formatIndianTime(date = new Date()) {
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Function to get Indian timezone offset
function getIndianTimezoneOffset() {
  return '+05:30'; // IST offset
}

module.exports = {
  getIndianTime,
  getCurrentIndianTime,
  formatIndianDate,
  formatIndianTime,
  getIndianTimezoneOffset
}; 