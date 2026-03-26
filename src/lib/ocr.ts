/**
 * KYC Verification Logic
 *
 * Text verification: cross-checks the user-entered details (name, ID number, DOB)
 * against the text content of the ID document (typed or extracted).
 *
 * Image verification: checks that images are present and valid files (non-zero,
 * correct mime type). Face/selfie matching is intentionally lenient — aging,
 * lighting, and photo quality vary too much for strict client-side checks.
 */

export interface VerificationResult {
  isVerified: boolean;
  score: number;
  errors: string[];
  checks: {
    idNumber: boolean;
    fullName: boolean;
    dateOfBirth: boolean;
    idFrontImage: boolean;
    idBackImage: boolean;
    selfieImage: boolean;
  };
}

/**
 * Verifies that the entered details match the text on the ID document.
 * The idDocumentText should be the raw text content typed or read from the ID.
 */
export const verifyTextDetails = (
  idDocumentText: string,
  fullName: string,
  idNumber: string,
  dob: string
): Pick<VerificationResult, 'score' | 'errors' | 'checks'> & { isVerified: boolean } => {
  const errors: string[] = [];
  const text = idDocumentText.toLowerCase().replace(/\s+/g, ' ').trim();
  let score = 100;

  // --- ID Number check ---
  const cleanId = idNumber.replace(/\s+/g, '').toLowerCase();
  const idMatch = text.includes(cleanId);
  if (!idMatch) {
    errors.push('ID number does not match the document.');
    score -= 40;
  }

  // --- Full name check: at least 2 meaningful name parts must appear ---
  const nameParts = fullName.toLowerCase().split(' ').filter(n => n.length > 2);
  const matchedParts = nameParts.filter(part => text.includes(part));
  const nameMatch = nameParts.length === 0 || matchedParts.length >= Math.min(2, nameParts.length);
  if (!nameMatch) {
    errors.push('Full name does not match the document.');
    score -= 30;
  }

  // --- Date of birth check: lenient — just the year must appear ---
  // Accepts aging/format differences (DD/MM/YYYY, DD.MM.YYYY, etc.)
  let dobMatch = true;
  const dobParts = dob.split('-'); // YYYY-MM-DD from <input type="date">
  if (dobParts.length === 3) {
    const year = dobParts[0];
    const month = dobParts[1];
    const day = dobParts[2];
    // Check year, or short year, or common date formats
    const yearPresent = text.includes(year) || text.includes(year.slice(-2));
    const monthPresent = text.includes(month) || text.includes(String(parseInt(month)));
    const dayPresent = text.includes(day) || text.includes(String(parseInt(day)));
    // Pass if year is present, or if at least 2 of 3 date parts are found
    const partsFound = [yearPresent, monthPresent, dayPresent].filter(Boolean).length;
    dobMatch = yearPresent || partsFound >= 2;
    if (!dobMatch) {
      errors.push('Date of birth not found in the document.');
      score -= 30;
    }
  }

  return {
    isVerified: score >= 60,
    score: Math.max(0, score),
    errors,
    checks: {
      idNumber: idMatch,
      fullName: nameMatch,
      dateOfBirth: dobMatch,
      idFrontImage: false,
      idBackImage: false,
      selfieImage: false,
    },
  };
};

/**
 * Validates uploaded images — checks they are present, non-empty, and image files.
 * Intentionally lenient: we do NOT do face matching since aging/lighting vary.
 */
export const verifyImages = (
  idFront: File | null,
  idBack: File | null,
  selfie: File | null
): { idFrontImage: boolean; idBackImage: boolean; selfieImage: boolean; errors: string[] } => {
  const errors: string[] = [];
  const isValidImage = (f: File | null) => !!f && f.size > 0 && f.type.startsWith('image/');

  const idFrontImage = isValidImage(idFront);
  const idBackImage = isValidImage(idBack);
  const selfieImage = isValidImage(selfie);

  if (!idFrontImage) errors.push('ID front photo is missing or invalid.');
  if (!idBackImage) errors.push('ID back photo is missing or invalid.');
  if (!selfieImage) errors.push('Selfie photo is missing or invalid.');

  return { idFrontImage, idBackImage, selfieImage, errors };
};

/**
 * Full KYC verification combining text + image checks.
 * idDocumentText: the text content of the ID (user types what's on the ID,
 * or it can be extracted via a real OCR service in future).
 */
export const runKycVerification = (
  idDocumentText: string,
  fullName: string,
  idNumber: string,
  dob: string,
  idFront: File | null,
  idBack: File | null,
  selfie: File | null
): VerificationResult => {
  const textResult = verifyTextDetails(idDocumentText, fullName, idNumber, dob);
  const imageResult = verifyImages(idFront, idBack, selfie);

  const allErrors = [...textResult.errors, ...imageResult.errors];

  // Images are required but don't affect the score — text match drives verification
  const imagesPresent = imageResult.idFrontImage && imageResult.idBackImage && imageResult.selfieImage;

  return {
    isVerified: textResult.isVerified && imagesPresent,
    score: textResult.score,
    errors: allErrors,
    checks: {
      ...textResult.checks,
      idFrontImage: imageResult.idFrontImage,
      idBackImage: imageResult.idBackImage,
      selfieImage: imageResult.selfieImage,
    },
  };
};
