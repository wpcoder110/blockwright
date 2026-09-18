import { describe, expect, it } from 'vitest'
import { toLocalSrc } from '../src/adapters'

describe('image URLs', () => {
  const site = 'http://localhost:3000'

  it('turns same-site URLs into paths and drops the cache tag', () => {
    // Payload adds ?<updatedAt> when `cacheTags` is on
    expect(toLocalSrc(`${site}/api/media/file/logo.png?2026-09-17T07%3A39%3A54.677Z`, site)).toBe('/api/media/file/logo.png')
    expect(toLocalSrc(`${site}/api/media/file/logo.png`, site)).toBe('/api/media/file/logo.png')
    expect(toLocalSrc('/api/media/file/logo.png?2026-09-17T07%3A39%3A54.677Z', site)).toBe('/api/media/file/logo.png')
    expect(toLocalSrc(`${site}/`, site)).toBe('/')
  })

  it('leaves remote URLs alone', () => {
    expect(toLocalSrc('https://cdn.example.com/a.png?v=2', site)).toBe('https://cdn.example.com/a.png?v=2')
    expect(toLocalSrc('https://other.test/a.png', site)).toBe('https://other.test/a.png')
    expect(toLocalSrc('data:image/svg+xml,abc', site)).toBe('data:image/svg+xml,abc')
  })

  it('works without a configured server URL', () => {
    expect(toLocalSrc('/api/media/file/a.png?x=1')).toBe('/api/media/file/a.png')
    expect(toLocalSrc('http://localhost:3000/api/media/file/a.png')).toBe('http://localhost:3000/api/media/file/a.png')
  })
})
