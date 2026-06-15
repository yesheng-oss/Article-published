import { describe, it, expect } from 'vitest'
import { parseMarkdownImages } from '../markdown-images'

describe('parseMarkdownImages', () => {
  it('parses basic markdown image', () => {
    const md = '![alt](https://example.com/a.png)'
    const matches = parseMarkdownImages(md)
    expect(matches).toHaveLength(1)
    expect(matches[0].alt).toBe('alt')
    expect(matches[0].src).toBe('https://example.com/a.png')
  })

  it('parses image with title in double quotes', () => {
    const md = '![alt](https://example.com/a.png "title")'
    const matches = parseMarkdownImages(md)
    expect(matches).toHaveLength(1)
    expect(matches[0].src).toBe('https://example.com/a.png')
  })

  it('parses image with title in single quotes', () => {
    const md = "![alt](https://example.com/a.png 'title')"
    const matches = parseMarkdownImages(md)
    expect(matches).toHaveLength(1)
    expect(matches[0].src).toBe('https://example.com/a.png')
  })

  it('parses image with parentheses in url', () => {
    const md = '![alt](https://example.com/img(1).png)'
    const matches = parseMarkdownImages(md)
    expect(matches).toHaveLength(1)
    expect(matches[0].src).toBe('https://example.com/img(1).png')
  })

  it('parses image with angle-bracket url', () => {
    const md = '![alt](<https://example.com/a.png>)'
    const matches = parseMarkdownImages(md)
    expect(matches).toHaveLength(1)
    expect(matches[0].src).toBe('https://example.com/a.png')
  })

  it('parses multiple images and preserves order', () => {
    const md = '![a](https://a.com/1.png) text ![b](https://b.com/2.png)'
    const matches = parseMarkdownImages(md)
    expect(matches).toHaveLength(2)
    expect(matches[0].src).toBe('https://a.com/1.png')
    expect(matches[1].src).toBe('https://b.com/2.png')
  })
})
