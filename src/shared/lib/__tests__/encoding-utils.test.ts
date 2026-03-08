import { describe, it, expect } from 'vitest'
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  encodeHtml,
  decodeHtml,
  utf8ByteLength
} from '../encoding-utils'

describe('encoding-utils', () => {
  describe('base64Encode', () => {
    it('encodes string to base64', () => {
      expect(base64Encode('Hello World')).toBe('SGVsbG8gV29ybGQ=')
      expect(base64Encode('test@example.com')).toBe('dGVzdEBleGFtcGxlLmNvbQ==')
      expect(base64Encode('')).toBe('')
    })

    it('handles unicode characters', () => {
      expect(base64Encode('안녕하세요')).toBe('7JWI64WV7ZWY7IS47JqU')
      expect(base64Encode('こんにちは')).toBe('44GT44KT44Gr44Gh44Gv')
      expect(base64Encode('🚀')).toBe('8J+agA==')
    })
  })

  describe('base64Decode', () => {
    it('decodes base64 back to string', () => {
      expect(base64Decode('SGVsbG8gV29ybGQ=')).toBe('Hello World')
      expect(base64Decode('dGVzdEBleGFtcGxlLmNvbQ==')).toBe('test@example.com')
      expect(base64Decode('')).toBe('')
    })

    it('handles unicode characters', () => {
      expect(base64Decode('7JWI64WV7ZWY7IS47JqU')).toBe('안녕하세요')
      expect(base64Decode('44GT44KT44Gr44Gh44Gv')).toBe('こんにちは')
      expect(base64Decode('8J+agA==')).toBe('🚀')
    })
  })

  describe('base64 roundtrip', () => {
    it('roundtrip encode/decode matches original', () => {
      const testStrings = [
        'Hello World',
        'Special chars: !@#$%^&*()',
        '한글 English 混合',
        'Line\nBreaks\r\nAnd\tTabs',
        '{"json": "data", "number": 123}',
        ''
      ]

      testStrings.forEach(str => {
        expect(base64Decode(base64Encode(str))).toBe(str)
      })
    })
  })

  describe('urlEncode', () => {
    it('encodes special characters for URLs', () => {
      expect(urlEncode('hello world')).toBe('hello%20world')
      expect(urlEncode('test@example.com')).toBe('test%40example.com')
      expect(urlEncode('key=value&other=data')).toBe('key%3Dvalue%26other%3Ddata')
      expect(urlEncode('')).toBe('')
    })

    it('preserves safe characters', () => {
      expect(urlEncode('abc123')).toBe('abc123')
      expect(urlEncode('test-file_name.txt')).toBe('test-file_name.txt')
    })

    it('handles unicode characters', () => {
      expect(urlEncode('안녕')).toBe('%EC%95%88%EB%85%95')
      expect(urlEncode('🚀')).toBe('%F0%9F%9A%80')
    })
  })

  describe('urlDecode', () => {
    it('decodes URL-encoded strings back', () => {
      expect(urlDecode('hello%20world')).toBe('hello world')
      expect(urlDecode('test%40example.com')).toBe('test@example.com')
      expect(urlDecode('key%3Dvalue%26other%3Ddata')).toBe('key=value&other=data')
      expect(urlDecode('')).toBe('')
    })

    it('preserves safe characters', () => {
      expect(urlDecode('abc123')).toBe('abc123')
      expect(urlDecode('test-file_name.txt')).toBe('test-file_name.txt')
    })

    it('handles unicode characters', () => {
      expect(urlDecode('%EC%95%88%EB%85%95')).toBe('안녕')
      expect(urlDecode('%F0%9F%9A%80')).toBe('🚀')
    })
  })

  describe('encodeHtml', () => {
    it('escapes HTML entities', () => {
      expect(encodeHtml('<div>Hello</div>')).toBe('&lt;div&gt;Hello&lt;/div&gt;')
      expect(encodeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
      expect(encodeHtml('"Quotes" and \'apostrophes\'')).toBe('&quot;Quotes&quot; and &#39;apostrophes&#39;')
      expect(encodeHtml('')).toBe('')
    })

    it('handles multiple occurrences', () => {
      expect(encodeHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;')
      expect(encodeHtml('& & &')).toBe('&amp; &amp; &amp;')
    })

    it('preserves safe characters', () => {
      expect(encodeHtml('Hello World 123')).toBe('Hello World 123')
      expect(encodeHtml('test@example.com')).toBe('test@example.com')
    })
  })

  describe('decodeHtml', () => {
    it('unescapes HTML entities', () => {
      expect(decodeHtml('&lt;div&gt;Hello&lt;/div&gt;')).toBe('<div>Hello</div>')
      expect(decodeHtml('Tom &amp; Jerry')).toBe('Tom & Jerry')
      expect(decodeHtml('&quot;Quotes&quot; and &#39;apostrophes&#39;')).toBe('"Quotes" and \'apostrophes\'')
      expect(decodeHtml('')).toBe('')
    })

    it('handles multiple occurrences', () => {
      expect(decodeHtml('&lt;&lt;&gt;&gt;')).toBe('<<>>')
      expect(decodeHtml('&amp; &amp; &amp;')).toBe('& & &')
    })

    it('preserves unencoded text', () => {
      expect(decodeHtml('Hello World 123')).toBe('Hello World 123')
      expect(decodeHtml('test@example.com')).toBe('test@example.com')
    })

    it('handles numeric entities', () => {
      expect(decodeHtml('&#39;')).toBe('\'')
      expect(decodeHtml('&#x27;')).toBe('\'')
    })
  })

  describe('utf8ByteLength', () => {
    it('counts bytes correctly for ASCII', () => {
      expect(utf8ByteLength('Hello')).toBe(5)
      expect(utf8ByteLength('123')).toBe(3)
      expect(utf8ByteLength('')).toBe(0)
    })

    it('counts bytes correctly for multi-byte characters', () => {
      // Korean characters (3 bytes each in UTF-8)
      expect(utf8ByteLength('안')).toBe(3)
      expect(utf8ByteLength('안녕')).toBe(6)

      // Japanese characters (3 bytes each)
      expect(utf8ByteLength('こ')).toBe(3)

      // Emoji (4 bytes)
      expect(utf8ByteLength('🚀')).toBe(4)
      expect(utf8ByteLength('👍')).toBe(4)
    })

    it('counts mixed content correctly', () => {
      // "Hello " (6 bytes) + "안녕" (6 bytes) = 12 bytes
      expect(utf8ByteLength('Hello 안녕')).toBe(12)

      // "Test" (4) + " " (1) + "🚀" (4) = 9 bytes
      expect(utf8ByteLength('Test 🚀')).toBe(9)
    })
  })
})