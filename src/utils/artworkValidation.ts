/**
 * Checks if the dimensions input string contains units (e.g. 'in', 'cm') which should be handled by the dropdown instead.
 */
export const checkForUnits = (text: string): boolean => {
  const unitKeywords = /\b(in|inch|inches|cm|ft|feet)\b/i;
  return unitKeywords.test(text);
};
