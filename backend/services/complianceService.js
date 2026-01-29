/**
 * Compliance Service for Israeli Labor Laws
 * Validates MERF requisitions against Israeli labor regulations
 */

const MINIMUM_WAGE_ILS = parseFloat(process.env.MINIMUM_WAGE_ILS || '5300');
const MAX_HOURS_MONTH = parseInt(process.env.MAX_HOURS_MONTH || '182');
const OVERTIME_RATE_FIRST = parseFloat(process.env.OVERTIME_RATE_FIRST || '1.25');
const OVERTIME_RATE_ADDITIONAL = parseFloat(process.env.OVERTIME_RATE_ADDITIONAL || '1.5');

/**
 * Check compliance of MERF requisition
 */
const checkCompliance = (requisitionData) => {
  const flags = [];

  // Check minimum wage
  if (requisitionData.salaryRange) {
    const salaryMatch = requisitionData.salaryRange.match(/(\d+)/);
    if (salaryMatch) {
      const minSalary = parseFloat(salaryMatch[1]);
      if (minSalary < MINIMUM_WAGE_ILS) {
        flags.push({
          flagType: 'minimum_wage',
          severity: 'critical',
          message: `Minimum salary (${minSalary} ILS) is below the legal minimum wage (${MINIMUM_WAGE_ILS} ILS)`,
          messageHe: `השכר המינימלי (${minSalary} ש"ח) נמוך מהשכר המינימלי החוקי (${MINIMUM_WAGE_ILS} ש"ח)`,
          field: 'salaryRange',
          value: requisitionData.salaryRange,
        });
      }
    }
  }

  // Check maximum working hours
  if (requisitionData.contractDuration) {
    // Extract hours if mentioned
    const hoursMatch = requisitionData.contractDuration.match(/(\d+)\s*hours?/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      if (hours > MAX_HOURS_MONTH) {
        flags.push({
          flagType: 'max_hours',
          severity: 'warning',
          message: `Working hours (${hours}) exceed maximum allowed per month (${MAX_HOURS_MONTH} hours)`,
          messageHe: `שעות העבודה (${hours}) חורגות מהמקסימום המותר לחודש (${MAX_HOURS_MONTH} שעות)`,
          field: 'contractDuration',
          value: requisitionData.contractDuration,
        });
      }
    }
  }

  // Check for discriminatory language
  const discriminatoryTerms = ['male only', 'female only', 'age limit', 'religion', 'ethnicity'];
  const description = (requisitionData.description || '').toLowerCase();
  const descriptionHe = (requisitionData.descriptionHe || '').toLowerCase();

  discriminatoryTerms.forEach((term) => {
    if (description.includes(term) || descriptionHe.includes(term)) {
      flags.push({
        flagType: 'discrimination',
        severity: 'critical',
        message: `Potential discriminatory language detected: "${term}"`,
        messageHe: `זוהה שפה מפלה אפשרית: "${term}"`,
        field: 'description',
        value: term,
      });
    }
  });

  // Check accommodation standards
  if (requisitionData.accommodationProvided && !requisitionData.accommodationDetails) {
    flags.push({
      flagType: 'accommodation_details',
      severity: 'info',
      message: 'Accommodation details should be provided when accommodation is offered',
      messageHe: 'יש לספק פרטי מגורים כאשר מוצעים מגורים',
      field: 'accommodationDetails',
      value: null,
    });
  }

  return {
    compliant: flags.filter((f) => f.severity === 'critical').length === 0,
    flags,
    summary: {
      totalFlags: flags.length,
      critical: flags.filter((f) => f.severity === 'critical').length,
      warnings: flags.filter((f) => f.severity === 'warning').length,
      info: flags.filter((f) => f.severity === 'info').length,
    },
  };
};

/**
 * Validate salary range format
 */
const validateSalaryRange = (salaryRange) => {
  if (!salaryRange) return { valid: false, message: 'Salary range is required' };

  // Check format: "8000-12000" or "8000" or "8000+"
  const patterns = [
    /^(\d+)-(\d+)$/, // Range format
    /^(\d+)\+?$/, // Single or plus format
  ];

  for (const pattern of patterns) {
    const match = salaryRange.match(pattern);
    if (match) {
      const min = parseFloat(match[1]);
      if (min < MINIMUM_WAGE_ILS) {
        return {
          valid: false,
          message: `Minimum salary must be at least ${MINIMUM_WAGE_ILS} ILS`,
        };
      }
      return { valid: true };
    }
  }

  return { valid: false, message: 'Invalid salary range format. Use: "8000-12000" or "8000"' };
};

/**
 * Calculate overtime rate based on hours
 */
const calculateOvertimeRate = (hours) => {
  if (hours <= MAX_HOURS_MONTH) {
    return 1.0; // No overtime
  }
  const overtimeHours = hours - MAX_HOURS_MONTH;
  if (overtimeHours <= 8) {
    return OVERTIME_RATE_FIRST; // First 8 hours of overtime
  }
  return OVERTIME_RATE_ADDITIONAL; // Additional overtime hours
};

module.exports = {
  checkCompliance,
  validateSalaryRange,
  calculateOvertimeRate,
  MINIMUM_WAGE_ILS,
  MAX_HOURS_MONTH,
  OVERTIME_RATE_FIRST,
  OVERTIME_RATE_ADDITIONAL,
};
