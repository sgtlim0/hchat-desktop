import { describe, it, expect } from 'vitest'
import {
  toTitleCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  countWords,
  countChars,
  countSentences,
  truncate,
  removeExtraWhitespace,
  extractUrls
} from '../text-transform'

describe('text-transform', () => {
  describe('toTitleCase', () => {
    it('converts basic text to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World')
      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox')
    })

    it('handles mixed case input', () => {
      expect(toTitleCase('HeLLo WoRLD')).toBe('Hello World')
      expect(toTitleCase('UPPERCASE TEXT')).toBe('Uppercase Text')
    })

    it('handles special characters and numbers', () => {
      expect(toTitleCase('hello-world 123')).toBe('Hello-World 123')
      expect(toTitleCase('test@email.com')).toBe('Test@Email.Com')
    })

    it('handles empty and single character strings', () => {
      expect(toTitleCase('')).toBe('')
      expect(toTitleCase('a')).toBe('A')
    })

    it('handles Korean text (preserves as-is)', () => {
      expect(toTitleCase('안녕하세요 world')).toBe('안녕하세요 World')
    })
  })

  describe('toCamelCase', () => {
    it('converts basic text to camelCase', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld')
      expect(toCamelCase('the quick brown fox')).toBe('theQuickBrownFox')
    })

    it('handles kebab-case input', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld')
      expect(toCamelCase('my-variable-name')).toBe('myVariableName')
    })

    it('handles snake_case input', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld')
      expect(toCamelCase('my_variable_name')).toBe('myVariableName')
    })

    it('handles mixed separators', () => {
      expect(toCamelCase('hello-world_test case')).toBe('helloWorldTestCase')
    })

    it('handles empty string', () => {
      expect(toCamelCase('')).toBe('')
    })
  })

  describe('toKebabCase', () => {
    it('converts basic text to kebab-case', () => {
      expect(toKebabCase('hello world')).toBe('hello-world')
      expect(toKebabCase('The Quick Brown Fox')).toBe('the-quick-brown-fox')
    })

    it('handles camelCase input', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world')
      expect(toKebabCase('myVariableName')).toBe('my-variable-name')
    })

    it('handles snake_case input', () => {
      expect(toKebabCase('hello_world')).toBe('hello-world')
    })

    it('handles PascalCase input', () => {
      expect(toKebabCase('HelloWorld')).toBe('hello-world')
      expect(toKebabCase('MyComponentName')).toBe('my-component-name')
    })

    it('handles consecutive uppercase letters', () => {
      expect(toKebabCase('XMLHttpRequest')).toBe('xml-http-request')
      expect(toKebabCase('IOError')).toBe('io-error')
    })
  })

  describe('toSnakeCase', () => {
    it('converts basic text to snake_case', () => {
      expect(toSnakeCase('hello world')).toBe('hello_world')
      expect(toSnakeCase('The Quick Brown Fox')).toBe('the_quick_brown_fox')
    })

    it('handles camelCase input', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world')
      expect(toSnakeCase('myVariableName')).toBe('my_variable_name')
    })

    it('handles kebab-case input', () => {
      expect(toSnakeCase('hello-world')).toBe('hello_world')
    })

    it('handles mixed input', () => {
      expect(toSnakeCase('Hello-World test_case')).toBe('hello_world_test_case')
    })
  })

  describe('countWords', () => {
    it('counts words in English text', () => {
      expect(countWords('Hello world')).toBe(2)
      expect(countWords('The quick brown fox jumps over the lazy dog')).toBe(9)
    })

    it('counts words in Korean text', () => {
      expect(countWords('안녕하세요 세계')).toBe(2)
      expect(countWords('오늘 날씨가 좋네요')).toBe(3)
    })

    it('counts words in mixed Korean-English text', () => {
      expect(countWords('Hello 안녕하세요 world 세계')).toBe(4)
    })

    it('handles multiple spaces and whitespace', () => {
      expect(countWords('Hello    world')).toBe(2)
      expect(countWords('  The   quick   brown   fox  ')).toBe(4)
    })

    it('handles punctuation', () => {
      expect(countWords('Hello, world! How are you?')).toBe(5)
      expect(countWords('안녕하세요, 오늘 날씨가 좋네요!')).toBe(4)
    })

    it('handles empty string and whitespace-only', () => {
      expect(countWords('')).toBe(0)
      expect(countWords('   ')).toBe(0)
    })
  })

  describe('countChars', () => {
    it('counts characters including spaces by default', () => {
      expect(countChars('Hello world')).toBe(11)
      expect(countChars('안녕하세요')).toBe(5)
    })

    it('counts characters excluding spaces when specified', () => {
      expect(countChars('Hello world', false)).toBe(10)
      expect(countChars('안녕 하세요', false)).toBe(5)
    })

    it('counts mixed text correctly', () => {
      expect(countChars('Hello 안녕')).toBe(8)
      expect(countChars('Hello 안녕', false)).toBe(7)
    })

    it('handles empty string', () => {
      expect(countChars('')).toBe(0)
      expect(countChars('', false)).toBe(0)
    })

    it('handles emoji and special characters', () => {
      expect(countChars('Hello 👋 World')).toBe(13)
      expect(countChars('🎉🎊🎈')).toBe(3)
    })
  })

  describe('countSentences', () => {
    it('counts sentences with periods', () => {
      expect(countSentences('Hello world. How are you.')).toBe(2)
      expect(countSentences('This is a sentence.')).toBe(1)
    })

    it('counts sentences with various punctuation', () => {
      expect(countSentences('Hello! How are you? I am fine.')).toBe(3)
      expect(countSentences('Really?! That is amazing!')).toBe(2)
    })

    it('handles Korean sentence endings', () => {
      expect(countSentences('안녕하세요. 오늘 날씨가 좋네요.')).toBe(2)
      expect(countSentences('정말요? 대단하네요!')).toBe(2)
    })

    it('handles abbreviations and decimals', () => {
      expect(countSentences('Dr. Smith went to the U.S.A. yesterday.')).toBe(1)
      expect(countSentences('The price is cheap. That is nice.')).toBe(2)
    })

    it('handles empty string and no sentences', () => {
      expect(countSentences('')).toBe(0)
      expect(countSentences('No punctuation here')).toBe(1)
    })
  })

  describe('truncate', () => {
    it('truncates text to specified length with default ellipsis', () => {
      expect(truncate('Hello world this is a long text', 11)).toBe('Hello world...')
      expect(truncate('Short', 10)).toBe('Short')
    })

    it('truncates with custom suffix', () => {
      expect(truncate('Hello world this is long', 11, '…')).toBe('Hello world…')
      expect(truncate('Hello world this is long', 11, ' [more]')).toBe('Hello world [more]')
    })

    it('handles Korean text correctly', () => {
      expect(truncate('안녕하세요 오늘 날씨가 좋네요', 5)).toBe('안녕하세요...')
    })

    it('does not truncate if text is shorter than max length', () => {
      expect(truncate('Short text', 20)).toBe('Short text')
      expect(truncate('Short', 20, '...')).toBe('Short')
    })

    it('handles edge cases', () => {
      expect(truncate('', 10)).toBe('')
      expect(truncate('Hello', 0)).toBe('...')
      expect(truncate('Hello', 3)).toBe('Hel...')
    })

    it('preserves word boundaries when truncating', () => {
      expect(truncate('Hello world this is long', 13)).toBe('Hello world...')
    })
  })

  describe('removeExtraWhitespace', () => {
    it('removes multiple spaces', () => {
      expect(removeExtraWhitespace('Hello    world')).toBe('Hello world')
      expect(removeExtraWhitespace('Too   many     spaces')).toBe('Too many spaces')
    })

    it('removes leading and trailing whitespace', () => {
      expect(removeExtraWhitespace('  Hello world  ')).toBe('Hello world')
      expect(removeExtraWhitespace('\t\nHello\t\n')).toBe('Hello')
    })

    it('handles tabs and newlines', () => {
      expect(removeExtraWhitespace('Hello\t\tworld')).toBe('Hello world')
      expect(removeExtraWhitespace('Hello\n\nworld')).toBe('Hello world')
    })

    it('handles Korean text', () => {
      expect(removeExtraWhitespace('안녕하세요    세계')).toBe('안녕하세요 세계')
    })

    it('handles empty string and whitespace-only', () => {
      expect(removeExtraWhitespace('')).toBe('')
      expect(removeExtraWhitespace('   ')).toBe('')
    })
  })

  describe('extractUrls', () => {
    it('extracts http and https URLs', () => {
      const text = 'Visit https://example.com and http://test.org for more info'
      expect(extractUrls(text)).toEqual(['https://example.com', 'http://test.org'])
    })

    it('extracts URLs with paths and query strings', () => {
      const text = 'Check https://example.com/path?query=1&test=2#anchor'
      expect(extractUrls(text)).toEqual(['https://example.com/path?query=1&test=2#anchor'])
    })

    it('extracts multiple URLs from text', () => {
      const text = 'Sites: https://google.com https://github.com and https://stackoverflow.com'
      expect(extractUrls(text)).toEqual([
        'https://google.com',
        'https://github.com',
        'https://stackoverflow.com'
      ])
    })

    it('handles www URLs without protocol', () => {
      const text = 'Visit www.example.com for details'
      expect(extractUrls(text)).toEqual(['www.example.com'])
    })

    it('extracts URLs with subdomains', () => {
      const text = 'API at https://api.example.com and https://blog.test.org'
      expect(extractUrls(text)).toEqual(['https://api.example.com', 'https://blog.test.org'])
    })

    it('handles text with no URLs', () => {
      expect(extractUrls('No URLs here')).toEqual([])
      expect(extractUrls('')).toEqual([])
    })

    it('handles URLs in Korean text', () => {
      const text = '웹사이트는 https://example.kr 입니다'
      expect(extractUrls(text)).toEqual(['https://example.kr'])
    })

    it('handles ftp and other protocols', () => {
      const text = 'Download from ftp://files.example.com'
      expect(extractUrls(text)).toEqual(['ftp://files.example.com'])
    })
  })
})