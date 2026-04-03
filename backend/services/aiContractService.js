/**
 * AI-assisted employment contract draft generator (India–Israel recruitment context).
 * Output is a starting document only — not legal advice; employers must have counsel review.
 */

let openai = null;
try {
  openai = require('openai');
} catch (_) {
  /* optional */
}

function getClient() {
  if (!openai) return null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    return new openai.OpenAI({ apiKey });
  } catch (e) {
    return null;
  }
}

function isContractAIAvailable() {
  return !!getClient();
}

const SYSTEM_PROMPT = `You are a drafting assistant for HR and recruitment teams. You produce a clear first-draft employment / placement contract in English.

Rules:
- Write for cross-border recruitment (worker from India, placement/work in Israel context) when relevant, but keep language practical and neutral unless the user specifies otherwise.
- Use numbered clauses and professional tone.
- Include placeholders like [EMPLOYER_LEGAL_NAME], [WORKER_FULL_NAME], [DATE], [GOVERNING_LAW] where specific legal details are unknown.
- Cover: parties, role/title, start date, duration/renewal if stated, compensation and payment cadence, working hours, leave, probation if stated, duties, confidentiality (brief), termination and notice, conduct, dispute resolution placeholder, signatures block.
- Add a short final section titled "DRAFT NOTICE" stating this is a template for legal review only and not legal advice.
- Do not invent government filing numbers or visa guarantees. Do not claim the document is enforceable without review.
- If information is missing, use bracketed placeholders instead of guessing.`;

function buildUserPrompt(ctx) {
  const lines = [
    `Employer (company name): ${ctx.employerCompany || '[EMPLOYER_NAME]'}`,
    `Worker name: ${ctx.candidateName || '[WORKER_NAME]'}`,
    ctx.candidateEmail ? `Worker email: ${ctx.candidateEmail}` : null,
    `Job title / role: ${ctx.jobTitle || '[JOB_TITLE]'}`,
    ctx.salary ? `Compensation (as provided): ${ctx.salary}` : null,
    ctx.workLocation ? `Primary work location: ${ctx.workLocation}` : null,
    ctx.startDate ? `Proposed start date: ${ctx.startDate}` : null,
    ctx.contractDurationMonths
      ? `Contract duration (months, if fixed term): ${ctx.contractDurationMonths}`
      : null,
    ctx.probationMonths != null && ctx.probationMonths !== ''
      ? `Probation period (months): ${ctx.probationMonths}`
      : null,
    ctx.workingHours ? `Working hours: ${ctx.workingHours}` : null,
    ctx.annualLeaveDays != null && ctx.annualLeaveDays !== ''
      ? `Annual leave (days): ${ctx.annualLeaveDays}`
      : null,
    ctx.noticePeriodDays != null && ctx.noticePeriodDays !== ''
      ? `Notice period (days): ${ctx.noticePeriodDays}`
      : null,
    ctx.additionalInstructions
      ? `Additional instructions from employer:\n${ctx.additionalInstructions}`
      : null,
    ctx.language && ctx.language !== 'en'
      ? `Preferred language for headings/labels where helpful: ${ctx.language}`
      : null,
  ].filter(Boolean);

  return `Generate a complete contract draft based on the following facts and placeholders.\n\n${lines.join('\n')}`;
}

/**
 * @param {object} ctx — resolved employer/candidate/job context
 * @returns {Promise<{ contractText: string, generatedAt: string }>}
 */
async function generateEmploymentContractDraft(ctx) {
  const client = getClient();
  if (!client) {
    throw new Error('OpenAI is not configured. Set OPENAI_API_KEY.');
  }

  const userContent = buildUserPrompt(ctx);

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.35,
    max_tokens: 4500,
  });

  const contractText = (completion.choices[0]?.message?.content || '').trim();
  if (!contractText) {
    throw new Error('Empty response from AI');
  }

  return {
    contractText,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  isContractAIAvailable,
  generateEmploymentContractDraft,
};
