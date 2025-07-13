
interface languageCodeObj {
  name: LanguageName;
  code: string;
  language_code?: string;
}

export enum LanguageName {
  Arabic = 'Arabic',
  Bengali = 'Bengali',
  Chinese = 'Chinese',
  Dutch = 'Dutch',
  English = 'English',
  EnglishIN = 'English-India',
  French = 'French',
  German = 'German',
  Hebrew = 'Hebrew',
  Hindi = 'Hindi',
  Indonesian = 'Indonesian',
  Italian = 'Italian',
  Japanese = 'Japanese',
  Kannada = 'Kannada',
  Korean = 'Korean',
  Malay = 'Malay',
  Persian = 'Persian',
  Portuguese = 'Portuguese',
  Russian = 'Russian',
  Spanish = 'Spanish',
  Tagalog = 'Tagalog',
  Tamil = 'Tamil',
  Thai = 'Thai',
  Turkish = 'Turkish',
  Vietnamese = 'Vietnamese',
  Welsh = 'Welsh'
}

export const languageCodeList: languageCodeObj[] = [
  { name: LanguageName.Arabic, code: '02', language_code: 'ar-EG' },
  { name: LanguageName.Bengali, code: '58', language_code: 'bn-IN' },
  { name: LanguageName.Chinese, code: '09', language_code: 'zh-CN' },
  { name: LanguageName.Dutch, code: '13', language_code: 'nl-NL' },
  { name: LanguageName.English, code: '14', language_code: 'en-US' },
  { name: LanguageName.EnglishIN, code: '15', language_code: 'en-IN' },
  { name: LanguageName.French, code: '17', language_code: 'fr-FR' },
  { name: LanguageName.German, code: '19', language_code: 'de-DE' },
  { name: LanguageName.Hebrew, code: '21', language_code: 'he-IL' },
  { name: LanguageName.Hindi, code: '22', language_code: 'hi-IN' },
  { name: LanguageName.Indonesian, code: '25', language_code: 'id-ID' },
  { name: LanguageName.Italian, code: '26', language_code: 'it-IT' },
  { name: LanguageName.Japanese, code: '27', language_code: 'ja-JP' },
  { name: LanguageName.Kannada, code: '28', language_code: 'kn-IN' },
  { name: LanguageName.Korean, code: '30', language_code: 'ko-KR' },
  { name: LanguageName.Malay, code: '34', language_code: 'ms-MY' },
  { name: LanguageName.Persian, code: '39', language_code: 'fa-IR' },
  { name: LanguageName.Portuguese, code: '41', language_code: 'pt-PT' },
  { name: LanguageName.Russian, code: '43', language_code: 'ru-RU' },
  { name: LanguageName.Spanish, code: '47', language_code: 'es-ES' },
  { name: LanguageName.Tagalog, code: '50', language_code: 'fil-PH' },
  { name: LanguageName.Tamil, code: '51', language_code: 'ta-IN' },
  { name: LanguageName.Thai, code: '52', language_code: 'th-TH' },
  { name: LanguageName.Turkish, code: '53', language_code: 'tr-TR' },
  { name: LanguageName.Vietnamese, code: '56', language_code: 'vi-VN' },
];

export const getLanguageCode = (language: LanguageName): string => {
  return languageCodeList.find(lang => lang.name === language)?.language_code
}