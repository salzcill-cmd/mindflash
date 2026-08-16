// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { buildOptions, shuffleArr } from '../src/lib/quiz'

describe('buildOptions (mode kuis)', () => {
  const cards = [
    { id: '1', back_text: 'A' },
    { id: '2', back_text: 'B' },
    { id: '3', back_text: 'C' },
    { id: '4', back_text: 'D' },
    { id: '5', back_text: 'E' },
  ]

  it('menghasilkan 4 opsi unik yang selalu berisi jawaban benar', () => {
    for (let i = 0; i < 25; i++) {
      const opts = buildOptions(cards[0], cards)
      expect(opts).toHaveLength(4)
      expect(new Set(opts).size).toBe(4)
      expect(opts).toContain('A')
    }
  })

  it('menangani deck kecil (kurang dari 4 jawaban unik)', () => {
    const small = [
      { id: '1', back_text: 'X' },
      { id: '2', back_text: 'Y' },
      { id: '3', back_text: 'Y' }, // jawaban duplikat
    ]
    const opts = buildOptions(small[0], small)
    expect(opts).toContain('X')
    expect(new Set(opts).size).toBe(2)
  })

  it('tidak memakai jawaban dari kartu yang sama sebagai pengecoh', () => {
    const dup = [
      { id: '1', back_text: 'SAMA' },
      { id: '2', back_text: 'Beda' },
      { id: '3', back_text: 'Beda Lagi' },
      { id: '4', back_text: 'Lain' },
      { id: '5', back_text: 'Lain Pula' },
    ]
    for (let i = 0; i < 15; i++) {
      const opts = buildOptions(dup[0], dup)
      expect(opts.filter((o) => o === 'SAMA')).toHaveLength(1)
    }
  })
})

describe('shuffleArr', () => {
  it('mengacak tanpa kehilangan elemen dan tidak mengubah array asli', () => {
    const arr = [1, 2, 3, 4, 5, 6]
    const out = shuffleArr(arr)
    expect([...out].sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b))
    expect(out).not.toBe(arr)
    expect(arr).toEqual([1, 2, 3, 4, 5, 6])
  })
})
