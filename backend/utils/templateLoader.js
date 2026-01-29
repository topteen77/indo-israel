const fs = require('fs');
const path = require('path');

/**
 * Load HTML template and replace placeholders
 * @param {string} templateName - Name of the template file (without .html)
 * @param {string} templateType - Type: 'emails' or 'pdf'
 * @param {object} data - Data object to replace placeholders
 * @returns {string} - Rendered HTML string
 */
const loadTemplate = (templateName, templateType = 'emails', data = {}) => {
  try {
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      templateType,
      `${templateName}.html`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    let html = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders with data
    // Support both {{variable}} and {{#if variable}}...{{/if}} syntax
    html = replacePlaceholders(html, data);

    return html;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
};

/**
 * Replace placeholders in HTML template
 * @param {string} html - HTML string with placeholders
 * @param {object} data - Data object
 * @returns {string} - HTML with replaced values
 */
const replacePlaceholders = (html, data) => {
  // Replace simple variables {{variable}}
  html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });

  // Handle {{#if variable}}...{{/if}} blocks
  html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    if (data[key]) {
      return content;
    }
    return '';
  });

  return html;
};

/**
 * Get default template data with common values
 * @returns {object} - Default data object
 */
const getDefaultTemplateData = () => {
  return {
    currentYear: new Date().getFullYear(),
    currentDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    recruitmentPhone: process.env.RECRUITMENT_PHONE || '+91 11 4747 4700',
    recruitmentEmail: process.env.RECRUITMENT_EMAIL || 'recruitment@apravas.com',
    recruitmentWhatsApp: process.env.RECRUITMENT_WHATSAPP || '+91 11 4747 4700',
    companyAddress: process.env.COMPANY_ADDRESS || 'Apravas Recruitment Platform, India',
    signatoryName: process.env.SIGNATORY_NAME || 'Recruitment Team',
    signatoryTitle: process.env.SIGNATORY_TITLE || 'Senior Recruitment Manager',
  };
};

/**
 * Merge default data with custom data
 * @param {object} customData - Custom data to merge
 * @returns {object} - Merged data object
 */
const prepareTemplateData = (customData = {}) => {
  const defaults = getDefaultTemplateData();
  return { ...defaults, ...customData };
};

module.exports = {
  loadTemplate,
  replacePlaceholders,
  getDefaultTemplateData,
  prepareTemplateData,
};
