/**
 * AI Job Post Generator Service
 * Uses OpenAI API to generate professional job postings
 */

let openai = null;

// Dynamically import OpenAI (with fallback if not installed)
try {
  openai = require('openai');
} catch (error) {
  console.warn('OpenAI package not installed. AI job generation will not work.');
  console.warn('To enable AI features, run: npm install openai');
}

const { checkCompliance } = require('./complianceService');

/**
 * Initialize OpenAI client
 */
function initializeOpenAI() {
  if (!openai) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured. AI job generation disabled.');
    return null;
  }

  try {
    return new openai.OpenAI({
      apiKey: apiKey,
    });
  } catch (error) {
    console.error('Error initializing OpenAI:', error);
    return null;
  }
}

/**
 * Generate job post using AI
 */
async function generateJobPost(jobData, options = {}) {
  const client = initializeOpenAI();
  
  if (!client) {
    throw new Error('OpenAI client not available. Please configure OPENAI_API_KEY.');
  }

  const {
    jobCategory,
    specificTrade,
    experienceRequired,
    qualifications = [],
    languagesRequired = [],
    salaryRange,
    workLocation,
    numberOfWorkers = 1,
    contractDuration,
    accommodationProvided = false,
    transportationProvided = false,
    otherBenefits = '',
    language = 'en',
  } = jobData;

  const {
    tone = 'professional',
    includeBenefits = true,
    includeRequirements = true,
    includeCompliance = true,
  } = options;

  // Build prompt for job post generation
  const prompt = buildJobPostPrompt(jobData, {
    tone,
    includeBenefits,
    includeRequirements,
    includeCompliance,
    language,
  });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(language),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedText = completion.choices[0]?.message?.content || '';
    
    // Parse generated content
    const parsedJobPost = parseGeneratedJobPost(generatedText, language);
    
    // Add compliance check if requested
    if (includeCompliance) {
      const complianceResult = checkCompliance({
        salaryRange: parsedJobPost.salaryRange || salaryRange,
        contractDuration: parsedJobPost.contractDuration || contractDuration,
        description: parsedJobPost.description,
      });
      
      parsedJobPost.complianceChecked = complianceResult.compliant;
      parsedJobPost.complianceFlags = complianceResult.flags;
    }

    return {
      success: true,
      jobPost: parsedJobPost,
      raw: generatedText,
    };
  } catch (error) {
    console.error('Error generating job post with AI:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Build prompt for job post generation
 */
function buildJobPostPrompt(jobData, options) {
  const {
    jobCategory,
    specificTrade,
    experienceRequired,
    qualifications = [],
    languagesRequired = [],
    salaryRange,
    workLocation,
    numberOfWorkers = 1,
    contractDuration,
    accommodationProvided = false,
    transportationProvided = false,
    otherBenefits = '',
    language = 'en',
  } = jobData;

  const { tone, includeBenefits, includeRequirements } = options;

  let prompt = `Generate a professional job posting for the following position:\n\n`;
  
  prompt += `Job Category: ${jobCategory}\n`;
  if (specificTrade) {
    prompt += `Specific Trade: ${specificTrade}\n`;
  }
  prompt += `Number of Workers Needed: ${numberOfWorkers}\n`;
  if (experienceRequired) {
    prompt += `Experience Required: ${experienceRequired}\n`;
  }
  if (salaryRange) {
    prompt += `Salary Range: ${salaryRange} ILS\n`;
  }
  prompt += `Work Location: ${workLocation}\n`;
  if (contractDuration) {
    prompt += `Contract Duration: ${contractDuration}\n`;
  }

  if (includeRequirements && qualifications.length > 0) {
    prompt += `\nRequired Qualifications:\n${qualifications.map(q => `- ${q}`).join('\n')}\n`;
  }

  if (languagesRequired.length > 0) {
    prompt += `\nLanguages Required: ${languagesRequired.join(', ')}\n`;
  }

  if (includeBenefits) {
    prompt += `\nBenefits:\n`;
    if (accommodationProvided) {
      prompt += `- Accommodation provided\n`;
    }
    if (transportationProvided) {
      prompt += `- Transportation provided\n`;
    }
    if (otherBenefits) {
      prompt += `- ${otherBenefits}\n`;
    }
  }

  prompt += `\nTone: ${tone}\n`;
  prompt += `Language: ${language === 'he' ? 'Hebrew' : 'English'}\n`;

  prompt += `\nPlease generate a complete job posting that includes:\n`;
  prompt += `1. An engaging job title\n`;
  prompt += `2. A compelling job description (2-3 paragraphs)\n`;
  prompt += `3. Key responsibilities\n`;
  prompt += `4. Required qualifications and skills\n`;
  prompt += `5. Benefits and compensation details\n`;
  prompt += `6. Application instructions\n`;

  if (language === 'he') {
    prompt += `\nIMPORTANT: Generate the entire job posting in Hebrew (עברית) with RTL formatting.\n`;
  }

  prompt += `\nEnsure the posting is compliant with Israeli labor laws, professional, and attractive to potential candidates.`;

  return prompt;
}

/**
 * Get system prompt for AI
 */
function getSystemPrompt(language) {
  const basePrompt = `You are an expert job posting writer specializing in recruitment for skilled workers in Israel. 
You create professional, compliant, and engaging job postings that attract qualified candidates while adhering to Israeli labor laws.

Key requirements:
- All job postings must comply with Israeli labor laws
- Minimum wage: ILS 5,300
- Maximum working hours: 182 hours per month
- No discriminatory language
- Clear, professional tone
- Accurate representation of job requirements
- Attractive benefits presentation`;

  if (language === 'he') {
    return `${basePrompt}\n\nYou must respond in Hebrew (עברית) with proper RTL formatting.`;
  }

  return basePrompt;
}

/**
 * Parse generated job post text into structured format
 */
function parseGeneratedJobPost(text, language) {
  // Try to extract structured information from generated text
  const jobPost = {
    title: '',
    description: '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    salaryRange: '',
    contractDuration: '',
    applicationInstructions: '',
    raw: text,
  };

  // Extract title (usually first line or after "Title:")
  const titleMatch = text.match(/(?:Title|כותרת)[:\s]+(.+?)(?:\n|$)/i) || 
                     text.match(/^(.+?)(?:\n|$)/);
  if (titleMatch) {
    jobPost.title = titleMatch[1].trim();
  }

  // Extract description (usually a paragraph or two)
  const descMatch = text.match(/(?:Description|תיאור)[:\s]+(.+?)(?:\n\n|Responsibilities|Requirements|Benefits|$)/is);
  if (descMatch) {
    jobPost.description = descMatch[1].trim();
  } else {
    // Fallback: use first substantial paragraph
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
    if (paragraphs.length > 0) {
      jobPost.description = paragraphs[0].trim();
    }
  }

  // Extract responsibilities
  const respMatch = text.match(/(?:Responsibilities|Key Responsibilities|תפקידים|אחריות)[:\s]+(.+?)(?:\n\n|Requirements|Benefits|$)/is);
  if (respMatch) {
    const responsibilities = respMatch[1]
      .split(/\n[-•*]/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
    jobPost.responsibilities = responsibilities;
  }

  // Extract requirements
  const reqMatch = text.match(/(?:Requirements|Required Qualifications|דרישות)[:\s]+(.+?)(?:\n\n|Benefits|Salary|$)/is);
  if (reqMatch) {
    const requirements = reqMatch[1]
      .split(/\n[-•*]/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
    jobPost.requirements = requirements;
  }

  // Extract benefits
  const benefitsMatch = text.match(/(?:Benefits|Compensation|הטבות)[:\s]+(.+?)(?:\n\n|Application|$)/is);
  if (benefitsMatch) {
    const benefits = benefitsMatch[1]
      .split(/\n[-•*]/)
      .map(b => b.trim())
      .filter(b => b.length > 0);
    jobPost.benefits = benefits;
  }

  // Extract salary
  const salaryMatch = text.match(/(?:Salary|Compensation|שכר)[:\s]+(.+?)(?:\n|$)/i);
  if (salaryMatch) {
    jobPost.salaryRange = salaryMatch[1].trim();
  }

  // Extract contract duration
  const durationMatch = text.match(/(?:Contract Duration|Duration|משך חוזה)[:\s]+(.+?)(?:\n|$)/i);
  if (durationMatch) {
    jobPost.contractDuration = durationMatch[1].trim();
  }

  // Extract application instructions
  const appMatch = text.match(/(?:How to Apply|Application|להגיש מועמדות)[:\s]+(.+?)$/is);
  if (appMatch) {
    jobPost.applicationInstructions = appMatch[1].trim();
  }

  return jobPost;
}

/**
 * Generate bilingual job post (English and Hebrew)
 */
async function generateBilingualJobPost(jobData, options = {}) {
  const englishPost = await generateJobPost(jobData, { ...options, language: 'en' });
  const hebrewPost = await generateJobPost(jobData, { ...options, language: 'he' });

  return {
    success: true,
    english: englishPost.jobPost,
    hebrew: hebrewPost.jobPost,
    compliance: {
      checked: englishPost.jobPost.complianceChecked,
      flags: englishPost.jobPost.complianceFlags || [],
    },
  };
}

/**
 * Check if AI service is available
 */
function isAIAvailable() {
  return !!process.env.OPENAI_API_KEY && !!openai;
}

module.exports = {
  generateJobPost,
  generateBilingualJobPost,
  isAIAvailable,
  initializeOpenAI,
};
