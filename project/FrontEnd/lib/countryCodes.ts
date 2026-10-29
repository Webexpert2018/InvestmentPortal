import { Country } from 'country-state-city';

const TOP_COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];

// Generate comprehensive list of country phone codes
const buildCountryCodes = (): string[] => {
  try {
    const allCountries = Country.getAllCountries();
    const otherCountries: { name: string; code: string }[] = [];

    allCountries.forEach((c) => {
      // US, GB, IN are already in TOP_COUNTRY_CODES
      if (['US', 'GB', 'IN'].includes(c.isoCode)) return;

      const raw = c.phonecode || '';
      if (!raw) return;

      let dialCode = raw.split(/[\s,]+/)[0];
      if (!dialCode.startsWith('+')) dialCode = '+' + dialCode;
      dialCode = dialCode.split('-')[0];

      let displayName = c.name;
      if (c.isoCode === 'AE') displayName = 'UAE';

      otherCountries.push({
        name: c.name,
        code: `${dialCode} (${displayName})`,
      });
    });

    otherCountries.sort((a, b) => a.name.localeCompare(b.name));

    return [...TOP_COUNTRY_CODES, ...otherCountries.map((c) => c.code)];
  } catch (err) {
    console.error('Error generating country codes:', err);
    return TOP_COUNTRY_CODES;
  }
};

export const COUNTRY_CODES: string[] = buildCountryCodes();

/**
 * Extracts dial code prefix (e.g. "+1", "+44")
 */
export const getCallingCode = (countryCode: string): string => {
  if (!countryCode) return '+1';
  return countryCode.split(' ')[0] || '+1';
};

/**
 * Strips non-digits and leading national prefixes based on country code.
 */
export const cleanPhoneInput = (value: string, countryCode: string): string => {
  let digits = value.replace(/\D/g, '');
  if (countryCode.includes('+1')) {
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
  } else if (countryCode.includes('+91')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
  } else if (countryCode.includes('+44')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('44')) {
      digits = digits.slice(2);
    }
  }
  return digits;
};

/**
 * Formats a phone number for input display.
 */
export const formatPhoneNumber = (value: string, countryCode: string): string => {
  const digits = cleanPhoneInput(value, countryCode);
  const isUK = countryCode.includes('+44');
  const maxDigits = isUK ? 11 : countryCode.includes('+1') || countryCode.includes('+91') ? 10 : 15;
  const trimmed = digits.slice(0, maxDigits);

  if (countryCode.includes('+1')) {
    if (trimmed.length <= 3) return trimmed;
    if (trimmed.length <= 6) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  }

  return trimmed;
};

/**
 * Parses and formats any stored phone string for display across UI pages.
 */
export const formatPhoneDisplay = (phoneStr: string | null | undefined): string => {
  if (!phoneStr) return '';

  const matchedCode = COUNTRY_CODES.find((code) => {
    const prefix = code.split(' ')[0];
    return phoneStr.startsWith(code) || phoneStr.startsWith(prefix);
  });

  if (!matchedCode) return phoneStr;

  let localNumber = '';
  if (phoneStr.startsWith(matchedCode)) {
    localNumber = phoneStr.slice(matchedCode.length).trim();
  } else {
    const cleanPrefix = matchedCode.split(' ')[0];
    if (phoneStr.startsWith(cleanPrefix)) {
      localNumber = phoneStr.slice(cleanPrefix.length).trim();
    } else {
      localNumber = phoneStr.trim();
    }
  }

  const formattedLocal = formatPhoneNumber(localNumber, matchedCode);
  return `${matchedCode} ${formattedLocal}`.trim();
};

/**
 * Parses any raw phone string stored in the DB (with or without country code prefix),
 * optionally using country ISO code for disambiguation (e.g. +1 US vs CA),
 * returning the matching dropdown code and clean local number digits.
 */
export const parsePhoneFromDb = (
  rawPhone: string | null | undefined,
  countryIso?: string
): { phoneCountryCode: string; phoneNumber: string } => {
  const phone = (rawPhone || '').trim();
  let phoneCountryCode = '+1 (USA)';
  let phoneNumber = '';

  if (!phone) {
    if (countryIso) {
      const match = COUNTRY_CODES.find((c) => {
        if (countryIso === 'US' && c === '+1 (USA)') return true;
        if (countryIso === 'GB' && c === '+44 (UK)') return true;
        if (countryIso === 'IN' && c === '+91 (IN)') return true;
        const countryObj = Country.getCountryByCode(countryIso);
        return countryObj && c.includes(`(${countryObj.name})`);
      });
      if (match) phoneCountryCode = match;
    }
    return { phoneCountryCode, phoneNumber };
  }

  // 1. Direct exact prefix match with full code (e.g. '+49 (Germany) 12345')
  const exactMatch = COUNTRY_CODES.find((c) => phone.startsWith(c));
  if (exactMatch) {
    phoneCountryCode = exactMatch;
    phoneNumber = phone.slice(exactMatch.length).replace(/\D/g, '');
    return { phoneCountryCode, phoneNumber };
  }

  // 2. Starts with dial code (e.g. '+49 12345' or '+91 98765' or '+1 5551234')
  if (phone.startsWith('+')) {
    const matches = COUNTRY_CODES.filter((c) => {
      const dial = c.split(' ')[0];
      return phone.startsWith(dial + ' ') || phone.startsWith(dial);
    }).sort((a, b) => b.split(' ')[0].length - a.split(' ')[0].length);

    if (matches.length > 0) {
      if (countryIso) {
        const countryMatch = matches.find((c) => {
          if (countryIso === 'US' && c === '+1 (USA)') return true;
          if (countryIso === 'GB' && c === '+44 (UK)') return true;
          if (countryIso === 'IN' && c === '+91 (IN)') return true;
          const countryObj = Country.getCountryByCode(countryIso);
          return countryObj && c.includes(`(${countryObj.name})`);
        });
        if (countryMatch) matches.unshift(countryMatch);
      }

      phoneCountryCode = matches[0];
      const dial = phoneCountryCode.split(' ')[0];
      const escapedDial = dial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      phoneNumber = phone.replace(new RegExp(`^${escapedDial}\\s*`), '').replace(/\D/g, '');
      return { phoneCountryCode, phoneNumber };
    }
  }

  // 3. Fallback: plain digits
  if (countryIso) {
    const countryMatch = COUNTRY_CODES.find((c) => {
      if (countryIso === 'US' && c === '+1 (USA)') return true;
      if (countryIso === 'GB' && c === '+44 (UK)') return true;
      if (countryIso === 'IN' && c === '+91 (IN)') return true;
      const countryObj = Country.getCountryByCode(countryIso);
      return countryObj && c.includes(`(${countryObj.name})`);
    });
    if (countryMatch) phoneCountryCode = countryMatch;
  }
  phoneNumber = phone.replace(/\D/g, '');
  return { phoneCountryCode, phoneNumber };
};
