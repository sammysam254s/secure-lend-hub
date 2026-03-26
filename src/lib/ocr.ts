export const extractTextFromImage = async (imageFile: File, simulatedText: string = ''): Promise<string> => {
  try {
    // Simulate a 3-second OCR scan delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Return the simulated text (we pass the user's input to automatically "pass" the check for the demo)
    return simulatedText.toLowerCase();
  } catch (error) {
    console.error('OCR Simulation failed:', error);
    throw new Error('Failed to read ID image');
  }
};

export const verifyKycDetails = (
  extractedText: string,
  fullName: string,
  idNumber: string,
  dob: string
): { isVerified: boolean; score: number; errors: string[] } => {
  const errors: string[] = [];
  const text = extractedText.replace(/\s+/g, ' ').trim();
  let score = 100;

  // Verify ID Number
  const cleanId = idNumber.replace(/\s+/g, '');
  if (!text.includes(cleanId)) {
    errors.push('ID Number not clearly detected in the document.');
    score -= 40;
  }

  // Verify Name - checking if at least 2 parts of the name matches
  const names = fullName.toLowerCase().split(' ').filter(n => n.length > 2);
  let matchedNames = 0;
  names.forEach(namePart => {
    if (text.includes(namePart)) {
      matchedNames++;
    }
  });

  if (names.length > 0 && matchedNames < Math.min(2, names.length)) {
    errors.push('Full Name does not adequately match the document text.');
    score -= 30;
  }

  // Verify DOB (often formats like DD/MM/YYYY or DD.MM.YYYY get misread, so we check just the year/month pieces roughly)
  const dobParts = dob.split('-'); // incoming from <input type="date"> (YYYY-MM-DD)
  if (dobParts.length === 3) {
    const year = dobParts[0];
    const month = dobParts[1];
    
    // As long as the year is present, we consider it a loose pass for the demo
    if (!text.includes(year) && !text.includes(year.slice(-2))) {
      errors.push('Birth year not detected.');
      score -= 30;
    }
  }

  return {
    isVerified: score >= 60,
    score: Math.max(0, score),
    errors,
  };
};
