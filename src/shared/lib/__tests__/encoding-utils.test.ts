import { describe, it, expect } from 'vitest'
import { base64Encode, base64Decode, urlEncode, urlDecode, encodeHtml, decodeHtml, utf8ByteLength } from '../encoding-utils'

describe('encoding-utils', () => {
  it('base64 encode/decode roundtrip', () => {
    const original = 'Hello World! 한국어'
    expect(base64Decode(base64Encode(original))).toBe(original)
  })

  it('base64Encode', () => {
    expect(base64Encode('Hello')).toBeTruthy()
  })

  it('urlEncode encodes special chars', () => {
    expect(urlEncode('hello world')).toBe('hello%20world')
    expect(urlEncode('a=1&b=2')).toContain('%26')
  })

  it('urlDecode roundtrip', () => {
    expect(urlDecode(urlEncode('test value'))).toBe('test value')
  })

  it('encodeHtml escapes entities', () => {
    expect(encodeHtml('<div>"test"</div>')).toBe('&lt;div&gt;&quot;test&quot;&lt;/div&gt;')
  })

  it('decodeHtml unescapes', () => {
    expect(decodeHtml('&lt;b&gt;bold&lt;/b&gt;')).toBe('<b>bold</b>')
  })

  it('encode/decode html roundtrip', () => {
    const orig = '<p>Hello & "World"</p>'
    expect(decodeHtml(encodeHtml(orig))).toBe(orig)
  })

  it('utf8ByteLength', () => {
    expect(utf8ByteLength('Hello')).toBe(5)
    expect(utf8ByteLength('한국어')).toBe(9) // 3 bytes per Korean char
  })
})
