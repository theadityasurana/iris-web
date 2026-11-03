/**
 * Sanity check parsed resume data before auto-populating.
 * Strips out gibberish values, validates formats, and returns only clean data.
 * Runs client-side  - instant, no API call.
 */

const LOG = '[SANITY-CHECK]';

/** Strip Unicode escape sequences that PostgreSQL JSONB rejects (e.g. \u0000) */
function stripBadUnicode(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove null bytes and invalid Unicode escape sequences
    return value.replace(/\u0000/g, '').replace(/\\u[0-9a-fA-F]{4}/g, '');
  }
  if (Array.isArray(value)) return value.map(stripBadUnicode);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = stripBadUnicode(v);
    return out;
  }
  return value;
}

/** Check if a string looks like a real human name (not gibberish) */
function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;
  if (name.length > 40) return false;
  // Must contain mostly letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-ZÀ-ÿ\s'\-\.]+$/.test(name.trim())) return false;
  // Must not be all consonants or all vowels (gibberish indicator)
  const letters = name.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (letters.length < 2) return false;
  const vowelRatio = (letters.match(/[aeiou]/g) || []).length / letters.length;
  if (vowelRatio < 0.1 || vowelRatio > 0.85) return false;
  // Must not be common non-name words
  const blacklist = ['resume', 'curriculum', 'vitae', 'page', 'null', 'undefined', 'name', 'first', 'last'];
  if (blacklist.includes(letters)) return false;
  return true;
}

/** Check if a phone number looks valid */
function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** Check if an email looks valid */
function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Check if a URL looks valid */
function isValidUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\/.+\..+/.test(url.trim()) || /^[\w\-]+\.[\w\-]+\/.+/.test(url.trim());
}

/** Check if a location string looks real */
function isValidLocation(location: string): boolean {
  if (!location || location.trim().length < 3) return false;
  if (location.length > 80) return false;
  // Must contain mostly letters, spaces, commas
  if (!/^[a-zA-ZÀ-ÿ\s,.\-()]+$/.test(location.trim())) return false;
  // Must have at least one word with 3+ letters
  return location.split(/\s+/).some(w => /[a-zA-Z]{3,}/.test(w));
}

/** Check if a headline/text is not gibberish */
function isValidText(text: string, maxLen = 200): boolean {
  if (!text || text.trim().length < 3) return false;
  if (text.length > maxLen) return false;
  // Count readable words (3+ letter words)
  const words = text.split(/\s+/).filter(w => /[a-zA-Z]{2,}/.test(w));
  const totalWords = text.split(/\s+/).length;
  // At least 50% of words should be readable
  return totalWords > 0 && (words.length / totalWords) > 0.4;
}

/** Check if a company/institution name looks real */
function isValidOrgName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;
  if (name.length > 100) return false;
  // Must have at least one word with 2+ letters
  return name.split(/\s+/).some(w => /[a-zA-Z]{2,}/.test(w));
}

/** Check if a date string looks valid */
function isValidDate(date: string): boolean {
  if (!date) return true; // Empty dates are OK (optional)
  // Should contain a year or month name
  return /\d{4}/.test(date) || /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(date);
}

/** Validate a single work experience entry  - keep if ANY useful field exists */
function validateExperience(exp: any): any | null {
  if (!exp) return null;
  const hasTitle = isValidText(exp.title, 100);
  const hasCompany = isValidOrgName(exp.company);
  const hasDescription = exp.description && exp.description.trim().length > 5;
  const hasSkills = Array.isArray(exp.skills) && exp.skills.length > 0;
  const hasDate = isValidDate(exp.startDate) || isValidDate(exp.endDate);
  // Keep if at least one meaningful field exists
  if (!hasTitle && !hasCompany && !hasDescription && !hasSkills && !hasDate) {
    console.log(LOG, '❌ Skipping experience  - no useful fields:', exp.title, exp.company);
    return null;
  }
  return {
    ...exp,
    title: hasTitle ? exp.title : '',
    company: hasCompany ? exp.company : '',
    jobLocation: isValidLocation(exp.jobLocation) ? exp.jobLocation : '',
  };
}

/** Validate a single education entry  - keep if ANY useful field exists */
function validateEducation(edu: any): any | null {
  if (!edu) return null;
  const hasInstitution = isValidOrgName(edu.institution);
  const hasDegree = isValidText(edu.degree, 100);
  const hasField = isValidText(edu.field, 80);
  const hasDate = isValidDate(edu.startDate) || isValidDate(edu.endDate);
  const hasExtras = (edu.achievements && edu.achievements.trim().length > 2) ||
    (edu.extracurriculars && edu.extracurriculars.trim().length > 2) ||
    (edu.description && edu.description.trim().length > 2);
  // Keep if at least one meaningful field exists
  if (!hasInstitution && !hasDegree && !hasField && !hasDate && !hasExtras) {
    console.log(LOG, '❌ Skipping education  - no useful fields:', edu.institution, edu.degree);
    return null;
  }
  return {
    ...edu,
    institution: hasInstitution ? edu.institution : '',
    degree: hasDegree ? edu.degree : '',
    field: hasField ? edu.field : '',
  };
}

/** Validate a single project entry  - keep if ANY useful field exists */
function validateProject(proj: any): any | null {
  if (!proj) return null;
  const hasTitle = isValidText(proj.title, 120);
  const hasBullets = Array.isArray(proj.bullets) && proj.bullets.some((b: string) => isValidText(b, 500));
  const hasExposure = Array.isArray(proj.exposure) && proj.exposure.length > 0;
  const hasDate = proj.date && proj.date.trim().length > 2;
  if (!hasTitle && !hasBullets && !hasExposure && !hasDate) {
    console.log(LOG, '❌ Skipping project  - no useful fields:', proj.title);
    return null;
  }
  return {
    ...proj,
    title: hasTitle ? proj.title : '',
    organization: isValidOrgName(proj.organization) ? proj.organization : '',
    bullets: Array.isArray(proj.bullets)
      ? proj.bullets.filter((b: string) => isValidText(b, 500))
      : [],
    exposure: Array.isArray(proj.exposure)
      ? proj.exposure.filter((e: string) => e && e.trim().length > 0 && e.length < 60)
      : [],
  };
}

/** Validate a certification  - keep if ANY useful field exists */
function validateCertification(cert: any): any | null {
  if (!cert) return null;
  const hasName = cert.name && cert.name.trim().length > 1;
  const hasOrg = cert.issuingOrganization && cert.issuingOrganization.trim().length > 1;
  const hasUrl = isValidUrl(cert.credentialUrl);
  const hasSkills = Array.isArray(cert.skills) && cert.skills.length > 0;
  if (!hasName && !hasOrg && !hasUrl && !hasSkills) {
    console.log(LOG, '❌ Skipping certification  - no useful fields:', cert.name);
    return null;
  }
  return cert;
}

/** Validate an achievement  - keep if ANY useful field exists */
function validateAchievement(ach: any): any | null {
  if (!ach) return null;
  const hasTitle = ach.title && ach.title.trim().length > 1;
  const hasIssuer = ach.issuer && ach.issuer.trim().length > 1;
  const hasDate = ach.date && ach.date.trim().length > 1;
  const hasDesc = ach.description && ach.description.trim().length > 2;
  if (!hasTitle && !hasIssuer && !hasDate && !hasDesc) {
    console.log(LOG, '❌ Skipping achievement  - no useful fields:', ach.title);
    return null;
  }
  return ach;
}

/** Validate a skill entry */
function validateSkill(skill: any): any | null {
  if (!skill) return null;
  const name = typeof skill === 'string' ? skill : skill.name;
  if (!name || name.trim().length < 1 || name.length > 50) return null;
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return null;
  if (typeof skill === 'string') return skill;
  return { ...skill, name };
}

/**
 * Run sanity checks on all parsed data.
 * Returns a cleaned version with gibberish fields removed.
 */
export function sanitizeParsedData(data: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  let skipped: string[] = [];

  // Name
  if (isValidName(data.firstName)) {
    clean.firstName = data.firstName.trim();
  } else if (data.firstName) {
    skipped.push(`firstName: "${data.firstName}"`);
  }

  if (isValidName(data.lastName)) {
    clean.lastName = data.lastName.trim();
  } else if (data.lastName) {
    skipped.push(`lastName: "${data.lastName}"`);
  }

  // Phone  - split country code if present
  if (isValidPhone(data.phone)) {
    let phone = data.phone.trim();
    const ccMatch = phone.match(/^\+(\d{1,3})[\s\-]?(.+)$/);
    if (ccMatch) {
      clean.countryCode = `+${ccMatch[1]}`;
      clean.phone = ccMatch[2].replace(/[\s\-]/g, '').trim();
    } else {
      clean.phone = phone;
    }
  } else if (data.phone) {
    skipped.push(`phone: "${data.phone}"`);
  }

  // Email
  if (isValidEmail(data.email)) {
    clean.email = data.email.trim();
  } else if (data.email) {
    skipped.push(`email: "${data.email}"`);
  }

  // Location
  if (isValidLocation(data.location)) {
    clean.location = data.location.trim();
  } else if (data.location) {
    skipped.push(`location: "${data.location}"`);
  }

  // Headline
  if (isValidText(data.headline, 150)) {
    clean.headline = data.headline.trim();
  } else if (data.headline) {
    skipped.push(`headline: "${data.headline?.slice(0, 50)}..."`);
  }

  // URLs
  if (isValidUrl(data.linkedInUrl)) {
    clean.linkedInUrl = data.linkedInUrl.trim();
  } else if (data.linkedInUrl) {
    skipped.push(`linkedInUrl: "${data.linkedInUrl}"`);
  }

  if (isValidUrl(data.githubUrl)) {
    clean.githubUrl = data.githubUrl.trim();
  } else if (data.githubUrl) {
    skipped.push(`githubUrl: "${data.githubUrl}"`);
  }

  // Experience level
  const validLevels = ['internship', 'entry_level', 'junior', 'mid', 'senior', 'expert'];
  if (data.experienceLevel && validLevels.includes(data.experienceLevel)) {
    clean.experienceLevel = data.experienceLevel;
  } else if (data.experienceLevel) {
    skipped.push(`experienceLevel: "${data.experienceLevel}"`);
  }

  // Work experience
  if (Array.isArray(data.workExperience)) {
    const validExp = data.workExperience.map(validateExperience).filter(Boolean);
    if (validExp.length > 0) clean.workExperience = validExp;
    if (validExp.length < data.workExperience.length) {
      skipped.push(`workExperience: ${data.workExperience.length - validExp.length} entries skipped`);
    }
  }

  // Education
  if (Array.isArray(data.education)) {
    const validEdu = data.education.map(validateEducation).filter(Boolean);
    if (validEdu.length > 0) clean.education = validEdu;
    if (validEdu.length < data.education.length) {
      skipped.push(`education: ${data.education.length - validEdu.length} entries skipped`);
    }
  }

  // Skills
  if (Array.isArray(data.skills)) {
    const validSkills = data.skills.map(validateSkill).filter(Boolean);
    if (validSkills.length > 0) clean.skills = validSkills;
    if (validSkills.length < data.skills.length) {
      skipped.push(`skills: ${data.skills.length - validSkills.length} entries skipped`);
    }
  }

  // Projects
  if (Array.isArray(data.projects)) {
    const validProj = data.projects.map(validateProject).filter(Boolean);
    if (validProj.length > 0) clean.projects = validProj;
    if (validProj.length < data.projects.length) {
      skipped.push(`projects: ${data.projects.length - validProj.length} entries skipped`);
    }
  }

  // Certifications
  if (Array.isArray(data.certifications)) {
    const validCerts = data.certifications.map(validateCertification).filter(Boolean);
    if (validCerts.length > 0) clean.certifications = validCerts;
    if (validCerts.length < data.certifications.length) {
      skipped.push(`certifications: ${data.certifications.length - validCerts.length} entries skipped`);
    }
  }

  // Achievements
  if (Array.isArray(data.achievements)) {
    const validAch = data.achievements.map(validateAchievement).filter(Boolean);
    if (validAch.length > 0) clean.achievements = validAch;
    if (validAch.length < data.achievements.length) {
      skipped.push(`achievements: ${data.achievements.length - validAch.length} entries skipped`);
    }
  }

  // Log results
  if (skipped.length > 0) {
    console.log(LOG, '⚠️ Skipped gibberish fields:', skipped);
  } else {
    console.log(LOG, '✅ All fields passed sanity check');
  }

  return stripBadUnicode(clean) as Record<string, any>;
}
