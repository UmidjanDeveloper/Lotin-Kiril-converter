/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Uzbek Cyrillic <-> Latin Transliteration Utility Module
 * Highly optimized for speed, case preservation, and style retention.
 */

// Helper to check if a character is a Cyrillic vowel
const CYR_VOWELS = new Set('аеёиоуэюяўАЕЁИОУЭЮЯЎ');
const LAT_VOWELS = new Set('aeiouAEIOU');

function isCyrillicLetter(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 0x0400 && code <= 0x04FF);
}

// Exception dictionaries for high spelling accuracy
const CYR_TO_LAT_EXCEPTIONS: Record<string, string> = {
  'Тошкент': 'Toshkent', 'тошкент': 'toshkent',
  'Йўлдошев': "Yo'ldoshev", 'йўлдошев': "yo'ldoshev",
  'Юлдашев': "Yo'ldoshev", 'юлдашев': "yo'ldoshev",
  'Миллий': 'Milliy', 'миллий': 'milliy',
  'Президент': 'Prezident', 'президент': 'prezident',
  'Ҳуқуқ': 'Huquq', 'ҳуқуқ': 'huquq',
  'Судья': 'Sudya', 'судья': 'sudya',
  'съезд': "s'ezd", 'Съезд': "S'ezd",
  'сентябрь': 'sentabr', 'Сентябрь': 'Sentabr',
  'октябрь': 'oktabr', 'Октябрь': 'Oktabr',
  'ноябрь': 'noyabr', 'Ноябрь': 'Noyabr',
  'декабрь': 'dekabr', 'Декабрь': 'Dekabr',
  'январь': 'yanvar', 'Январь': 'Yanvar',
  'февраль': 'fevral', 'Февраль': 'Fevral',
  'апрель': 'aprel', 'Апрель': 'Aprel',
  'июнь': 'iyun', 'Июнь': 'Iyun',
  'июль': 'iyul', 'Июль': 'Iyul'
};

const LAT_TO_CYR_EXCEPTIONS: Record<string, string> = {
  'Toshkent': 'Тошкент', 'toshkent': 'тошкент',
  "Yo'ldoshev": 'Йўлдошев', "yo'ldoshev": 'йўлдошев',
  'Milliy': 'Миллий', 'milliy': 'миллий',
  'Prezident': 'Президент', 'prezident': 'президент',
  'Huquq': 'Ҳуқуқ', 'huquq': 'ҳуқуқ',
  'Sudya': 'Судья', 'sudya': 'судя',
  "s'ezd": 'съезд', "S'ezd": 'Съезд',
  'sentabr': 'сентябрь', 'Sentabr': 'Сентябрь',
  'oktabr': 'октябрь', 'Oktabr': 'Октябрь',
  'noyabr': 'ноябрь', 'Noyabr': 'Ноябрь',
  'dekabr': 'декабрь', 'Dekabr': 'Декабрь',
  'yanvar': 'январь', 'Yanvar': 'Январь',
  'fevral': 'февраль', 'Fevral': 'Февраль',
  'aprel': 'апрель', 'Aprel': 'Апрель',
  'iyun': 'июнь', 'Iyun': 'Июнь',
  'iyul': 'июль', 'Iyul': 'Июль'
};

function replaceExceptions(text: string, exceptions: Record<string, string>): string {
  let result = text;
  const sortedKeys = Object.keys(exceptions).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('(?<![a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ])' + escapedKey + '(?![a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ])', 'g');
    result = result.replace(regex, exceptions[key]);
  }
  return result;
}

// Standard single-character mappings
const CYR_TO_LAT_SINGLE: Record<string, string> = {
  'А': 'A', 'а': 'a',
  'Б': 'B', 'б': 'b',
  'В': 'V', 'в': 'v',
  'Г': 'G', 'г': 'g',
  'Д': 'D', 'д': 'd',
  'Ж': 'J', 'ж': 'j',
  'З': 'Z', 'з': 'z',
  'И': 'I', 'и': 'i',
  'Й': 'Y', 'й': 'y',
  'К': 'K', 'к': 'k',
  'Л': 'L', 'л': 'l',
  'М': 'M', 'м': 'm',
  'Н': 'N', 'н': 'n',
  'О': 'O', 'о': 'o',
  'П': 'P', 'п': 'p',
  'Р': 'R', 'р': 'r',
  'С': 'S', 'с': 's',
  'Т': 'T', 'т': 't',
  'У': 'U', 'у': 'u',
  'Ф': 'F', 'ф': 'f',
  'Х': 'X', 'х': 'x',
  'Ҳ': 'H', 'ҳ': 'h',
  'Қ': 'Q', 'қ': 'q',
  'Ь': '', 'ь': ''  // Usually ignored in Uzbek Latin
};

const LAT_TO_CYR_SINGLE: Record<string, string> = {
  'A': 'А', 'a': 'а',
  'B': 'Б', 'b': 'б',
  'D': 'Д', 'd': 'д',
  'F': 'Ф', 'f': 'ф',
  'G': 'Г', 'g': 'г',
  'H': 'Ҳ', 'h': 'ҳ',
  'I': 'И', 'i': 'и',
  'J': 'Ж', 'j': 'ж',
  'K': 'К', 'k': 'к',
  'L': 'Л', 'l': 'л',
  'M': 'М', 'm': 'м',
  'N': 'Н', 'n': 'н',
  'O': 'О', 'o': 'о',
  'P': 'П', 'p': 'п',
  'Q': 'Қ', 'q': 'қ',
  'R': 'Р', 'r': 'р',
  'S': 'С', 's': 'с',
  'T': 'Т', 't': 'т',
  'U': 'У', 'u': 'у',
  'V': 'В', 'v': 'в',
  'X': 'Х', 'x': 'х',
  'Y': 'Й', 'y': 'й',
  'Z': 'З', 'z': 'з'
};

// Check if next character in word is uppercase
function isNextCyrUpper(text: string, index: number): boolean {
  for (let j = index + 1; j < text.length; j++) {
    const c = text[j];
    if (isCyrillicLetter(c)) {
      return c === c.toUpperCase();
    }
    if (/\s/.test(c)) return false;
  }
  return false;
}

function isNextLatUpper(text: string, index: number): boolean {
  for (let j = index + 1; j < text.length; j++) {
    const c = text[j];
    if (/[a-zA-Z]/.test(c)) {
      return c === c.toUpperCase();
    }
    if (/\s/.test(c)) return false;
  }
  return false;
}

/**
 * Detects if the text has more Cyrillic characters than Latin.
 * Useful for automatic translation direction setting.
 */
export function detectLanguage(text: string): 'cyrillic' | 'latin' {
  let cyrCount = 0;
  let latCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x0400 && code <= 0x04FF)) {
      cyrCount++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latCount++;
    }
  }
  return cyrCount >= latCount ? 'cyrillic' : 'latin';
}

/**
 * Transliterates Uzbek Cyrillic string to Uzbek Latin
 */
export function cyrillicToLatin(text: string): string {
  const processedText = replaceExceptions(text, CYR_TO_LAT_EXCEPTIONS);
  let result = '';
  
  for (let i = 0; i < processedText.length; i++) {
    const char = processedText[i];
    const prevChar = i > 0 ? processedText[i - 1] : '';
    const nextChar = i < processedText.length - 1 ? processedText[i + 1] : '';
    
    // 1. Handle "Е" and "е"
    if (char === 'е' || char === 'Е') {
      const isWordStart = i === 0 || !isCyrillicLetter(prevChar);
      const isAfterVowel = prevChar ? CYR_VOWELS.has(prevChar) : false;
      
      if (isWordStart || isAfterVowel) {
        if (char === 'Е') {
          result += isNextCyrUpper(processedText, i) ? 'YE' : 'Ye';
        } else {
          result += 'ye';
        }
      } else {
        result += char === 'Е' ? 'E' : 'e';
      }
      continue;
    }
    
    // 2. Handle "Ц" and "ц"
    if (char === 'ц' || char === 'Ц') {
      const isWordStart = i === 0 || !isCyrillicLetter(prevChar);
      if (isWordStart) {
        if (char === 'Ц') {
          result += 'S';
        } else {
          result += 's';
        }
      } else {
        if (char === 'Ц') {
          result += isNextCyrUpper(processedText, i) ? 'TS' : 'Ts';
        } else {
          result += 'ts';
        }
      }
      continue;
    }
    
    // 3. Handle multi-character Cyrillic letters: Ч, Ш, Ё, Ю, Я, Ў, Ғ, Щ
    if (char === 'Ч' || char === 'ч') {
      const repl = char === 'Ч' ? (isNextCyrUpper(processedText, i) ? 'CH' : 'Ch') : 'ch';
      result += repl;
      continue;
    }
    if (char === 'Ш' || char === 'ш') {
      const repl = char === 'Ш' ? (isNextCyrUpper(processedText, i) ? 'SH' : 'Sh') : 'sh';
      result += repl;
      continue;
    }
    if (char === 'Щ' || char === 'щ') {
      const repl = char === 'Щ' ? (isNextCyrUpper(processedText, i) ? 'SHCH' : 'Shch') : 'shch';
      result += repl;
      continue;
    }
    if (char === 'Ё' || char === 'ё') {
      const repl = char === 'Ё' ? (isNextCyrUpper(processedText, i) ? 'YO' : 'Yo') : 'yo';
      result += repl;
      continue;
    }
    if (char === 'Ю' || char === 'ю') {
      const repl = char === 'Ю' ? (isNextCyrUpper(processedText, i) ? 'YU' : 'Yu') : 'yu';
      result += repl;
      continue;
    }
    if (char === 'Я' || char === 'я') {
      const repl = char === 'Я' ? (isNextCyrUpper(processedText, i) ? 'YA' : 'Ya') : 'ya';
      result += repl;
      continue;
    }
    if (char === 'Ў' || char === 'ў') {
      result += char === 'Ў' ? "O'" : "o'";
      continue;
    }
    if (char === 'Ғ' || char === 'ғ') {
      result += char === 'Ғ' ? "G'" : "g'";
      continue;
    }
    
    // 4. Tutuq belgisi "ъ" and standard single map
    if (char === 'ъ' || char === 'Ъ') {
      result += "'";
      continue;
    }
    
    // 5. Standard single lookup
    const mapped = CYR_TO_LAT_SINGLE[char];
    if (mapped !== undefined) {
      result += mapped;
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Transliterates Uzbek Latin string to Uzbek Cyrillic
 */
export function latinToCyrillic(text: string): string {
  const processedText = replaceExceptions(text, LAT_TO_CYR_EXCEPTIONS);
  let result = '';
  const len = processedText.length;
  
  // High-performance helper mapping for all possible apostrophe variations in Uzbek typing
  const isApostrophe = (c: string): boolean => {
    if (!c) return false;
    const code = c.charCodeAt(0);
    return (
      c === "'" ||
      c === "’" ||
      c === "‘" ||
      c === "ʻ" ||
      c === "ʼ" ||
      c === "`" ||
      c === "´" ||
      c === "″" ||
      c === "′" ||
      c === "‛" ||
      code === 96 ||   // backtick `
      code === 180 ||  // acute accent ´
      code === 8217 || // right single quote ’
      code === 8216 || // left single quote ‘
      code === 700 ||  // modifier letter apostrophe ʼ
      code === 699 ||  // modifier letter turned comma ʻ
      code === 8219    // high-reversed-9 single quote ‛
    );
  };

  for (let i = 0; i < len; i++) {
    const char = processedText[i];
    
    // Look ahead characters
    const char2 = i + 1 < len ? processedText[i + 1] : '';
    const char3 = i + 2 < len ? processedText[i + 2] : '';
    const char4 = i + 3 < len ? processedText[i + 3] : '';
    
    const token2 = char + char2;
    const token3 = char + char2 + char3;
    const token4 = char + char2 + char3 + char4;
    
    const isNextApos = isApostrophe(char2);
    const isNextNextApos = isApostrophe(char3);
    
    // 1. Check for "o'" and "g'" combinations (including variants)
    if ((char === 'o' || char === 'O' || char === 'ö' || char === 'Ö') && isNextApos) {
      const isUpper = char === 'O' || char === 'Ö';
      // Is it followed by another apostrophe for tutuq (like o'' -> ўъ)?
      if (isNextNextApos) {
        result += isUpper ? 'ЎЪ' : 'ўъ';
        i += 2;
      } else {
        result += isUpper ? 'Ў' : 'ў';
        i++;
      }
      continue;
    }
    
    if ((char === 'g' || char === 'G') && isNextApos) {
      const isUpper = char === 'G';
      result += isUpper ? 'Ғ' : 'ғ';
      i++;
      continue;
    }
    
    // 2. Multigraphs: shch, ch, sh, yo, yu, ya, ye (case insensitive checks)
    const lower4 = token4.toLowerCase();
    if (lower4 === 'shch') {
      const isUpper = char === 'S' && (char2 === 'h' || char2 === 'H') && (char3 === 'c' || char3 === 'C') && (char4 === 'h' || char4 === 'H');
      result += isUpper ? 'Щ' : 'щ';
      i += 3;
      continue;
    }

    const lower2 = token2.toLowerCase();
    
    if (lower2 === 'ch') {
      const isUpper = char === 'C' && (char2 === 'h' || char2 === 'H');
      result += isUpper ? 'Ч' : 'ч';
      i++;
      continue;
    }
    
    if (lower2 === 'sh') {
      const isUpper = char === 'S' && (char2 === 'h' || char2 === 'H');
      result += isUpper ? 'Ш' : 'ш';
      i++;
      continue;
    }
    
    if (lower2 === 'yo') {
      // If 'yo' is followed by an apostrophe (like o' or o’), then the 'o' belongs to 'o'' (ў).
      // So 'y' is solo and should be Й/й.
      if (isApostrophe(char3)) {
        const isUpper = char === 'Y';
        result += isUpper ? 'Й' : 'й';
        continue; // processes 'o' at the next index in the loop
      }
      const isUpper = char === 'Y' && (char2 === 'o' || char2 === 'O');
      result += isUpper ? 'Ё' : 'ё';
      i++;
      continue;
    }
    
    if (lower2 === 'yu') {
      const isUpper = char === 'Y' && (char2 === 'u' || char2 === 'U');
      result += isUpper ? 'Ю' : 'ю';
      i++;
      continue;
    }
    
    if (lower2 === 'ya') {
      const isUpper = char === 'Y' && (char2 === 'a' || char2 === 'A');
      result += isUpper ? 'Я' : 'я';
      i++;
      continue;
    }
    
    if (lower2 === 'ye') {
      const isUpper = char === 'Y' && (char2 === 'e' || char2 === 'E');
      result += isUpper ? 'Е' : 'е';
      i++;
      continue;
    }

    if (lower2 === 'ts') {
      const isUpper = char === 'T' && (char2 === 's' || char2 === 'S');
      result += isUpper ? 'Ц' : 'ц';
      i++;
      continue;
    }
    
    // 3. Handle standalone "E" vs "E" starting word
    if (char === 'e' || char === 'E') {
      const prevChar = i > 0 ? processedText[i - 1] : '';
      const isWordStart = i === 0 || !/[a-zA-Z]/.test(prevChar);
      const isAfterVowel = prevChar ? LAT_VOWELS.has(prevChar) : false;
      
      if (isWordStart || isAfterVowel) {
        result += char === 'E' ? 'Э' : 'э';
      } else {
        result += char === 'E' ? 'Е' : 'е';
      }
      continue;
    }
    
    // 4. Tutuq belgisi: Apostrophe used inside words (e.g., ma'no -> маъно, San'at -> Санъат)
    if (isApostrophe(char)) {
      const lastCyr = result.length > 0 ? result[result.length - 1] : '';
      // Perfect linguistic word-internal boundary check
      const isWordInternal = lastCyr && /[а-яА-ЯёЁўЎқҚғҒҳҲ]/.test(lastCyr) && /[a-zA-Z]/.test(char2);
      
      if (isWordInternal) {
        result += 'ъ';
      } else {
        result += "'"; // keep as standard quote at boundaries or for non-word contexts
      }
      continue;
    }
    
    // 5. Single char map
    const mapped = LAT_TO_CYR_SINGLE[char];
    if (mapped !== undefined) {
      result += mapped;
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Transliterates XML strings specifically between the tags `<w:t>` and `</w:t>` (for DOCX)
 * or `<t>` and `</t>` (for XLSX). It parses the tags carefully to keep attributes intact
 * and protects XML/HTML entities from corruption.
 */
export function transliterateXml(xml: string, direction: 'toLatin' | 'toCyrillic'): string {
  const transFunc = direction === 'toLatin' ? cyrillicToLatin : latinToCyrillic;
  
  const safeTrans = (text: string) => {
    // Collect XML/HTML entities to protect them from transliteration
    const entities: string[] = [];
    // Use ONLY non-alphabetic characters (hashes, underscores, digits) so transliterators never touch them!
    const textWithPlaceholders = text.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
      entities.push(match);
      return `##_#_${entities.length - 1}_#_##`;
    });
    
    // Transliterate the text safely
    const processed = transFunc(textWithPlaceholders);
    
    // Restore the entities exactly as they were
    return processed.replace(/##_#_(\d+)_#_##/g, (match, idx) => {
      return entities[parseInt(idx, 10)];
    });
  };

  // Replace content inside <w:t>...</w:t> blocks (DOCX text nodes)
  let updatedXml = xml.replace(/<w:t(?=[ \t\r\n>])([^>\/]*?)>([\s\S]*?)<\/w:t>/g, (match, attrs, text) => {
    return `<w:t${attrs || ''}>${safeTrans(text)}</w:t>`;
  });
  
  // Replace content inside <t>...</t> blocks (Excel and standard sharedStrings / sheet nodes)
  updatedXml = updatedXml.replace(/<t(?=[ \t\r\n>])([^>\/]*?)>([\s\S]*?)<\/t>/g, (match, attrs, text) => {
    return `<t${attrs || ''}>${safeTrans(text)}</t>`;
  });
  
  return updatedXml;
}
