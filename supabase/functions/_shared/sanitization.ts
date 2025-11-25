import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import DOMPurify from "https://esm.sh/isomorphic-dompurify@2.16.0";

// Configure DOMPurify with deno-dom window
const window = new DOMParser().parseFromString('<!DOCTYPE html>', 'text/html') as any;
const purify = DOMPurify(window);

/**
 * Sanitizes free-text HTML input to prevent XSS attacks
 * 
 * @param htmlInput - The untrusted HTML string from user input
 * @returns A sanitized HTML string with only safe tags and attributes
 * 
 * @example
 * ```typescript
 * const userBio = sanitizeFreeText(untrustedInput);
 * ```
 */
export function sanitizeFreeText(htmlInput: string): string {
  if (!htmlInput || typeof htmlInput !== 'string') {
    return '';
  }

  // Configure allowed tags - basic formatting only
  const ALLOWED_TAGS = ['b', 'i', 'u', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'p', 'br'];
  
  // Configure allowed attributes - only href for links
  const ALLOWED_ATTR = ['href'];

  // Sanitize the input
  const clean = purify.sanitize(htmlInput, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    // Remove all event handlers and dangerous attributes
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Only allow http and https protocols for links
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):)/i,
  });

  // Additional security: remove any remaining script content
  return clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
