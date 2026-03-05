import { describe, it, expect } from 'vitest'
import { parseToolCalls, stripToolCalls } from '../parser'

describe('parseToolCalls', () => {
  it('should parse a single tool call', () => {
    const text = `Some text
<tool_call>
<name>calculate</name>
<args>
<expression>2 + 2</expression>
</args>
</tool_call>`

    const result = parseToolCalls(text)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'calculate',
      args: { expression: '2 + 2' },
    })
  })

  it('should parse multiple tool calls', () => {
    const text = `
<tool_call>
<name>web_search</name>
<args>
<query>weather today</query>
</args>
</tool_call>
some text in between
<tool_call>
<name>get_datetime</name>
<args>
</args>
</tool_call>`

    const result = parseToolCalls(text)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('web_search')
    expect(result[0].args).toEqual({ query: 'weather today' })
    expect(result[1].name).toBe('get_datetime')
    expect(result[1].args).toEqual({})
  })

  it('should parse tool call with multiple args', () => {
    const text = `<tool_call>
<name>test_tool</name>
<args>
<param1>value1</param1>
<param2>value2</param2>
</args>
</tool_call>`

    const result = parseToolCalls(text)

    expect(result).toHaveLength(1)
    expect(result[0].args).toEqual({ param1: 'value1', param2: 'value2' })
  })

  it('should return empty array for no tool calls', () => {
    expect(parseToolCalls('just regular text')).toEqual([])
    expect(parseToolCalls('')).toEqual([])
  })

  it('should trim whitespace from name and args', () => {
    const text = `<tool_call>
<name>  calculate  </name>
<args>
<expression>  3 * 4  </expression>
</args>
</tool_call>`

    const result = parseToolCalls(text)

    expect(result[0].name).toBe('calculate')
    expect(result[0].args.expression).toBe('3 * 4')
  })
})

describe('stripToolCalls', () => {
  it('should remove tool call XML from text', () => {
    const text = `Here is the answer
<tool_call>
<name>calculate</name>
<args><expression>1+1</expression></args>
</tool_call>
The result is 2.`

    const result = stripToolCalls(text)

    expect(result).toBe('Here is the answer\n\nThe result is 2.')
    expect(result).not.toContain('tool_call')
  })

  it('should handle text with no tool calls', () => {
    expect(stripToolCalls('plain text')).toBe('plain text')
  })

  it('should handle multiple tool calls', () => {
    const text = `<tool_call><name>a</name><args></args></tool_call>text<tool_call><name>b</name><args></args></tool_call>`
    const result = stripToolCalls(text)
    expect(result).toBe('text')
  })
})
