import { describe, expect, it } from 'vitest'

import { calculate_sm2_review_state, resolve_sm2_memory_level } from '../../../src/main/sm2'

const TEST_NOW = new Date('2026-03-15T12:00:00.000Z')

describe('sm2', () => {
  it('updates easiness factor and interval for grade 5 on first successful review', () => {
    const next_state = calculate_sm2_review_state({
      review_state: create_review_state({
        repetition: 0,
        interval_days: 0,
        easiness_factor: 2.5,
      }),
      grade: 5,
      now: TEST_NOW,
    })

    expect(next_state.easiness_factor).toBeCloseTo(2.6, 5)
    expect(next_state.repetition).toBe(1)
    expect(next_state.interval_days).toBe(1)
    expect(next_state.next_review_at).toBe('2026-03-16T12:00:00.000Z')
    expect(next_state.last_review_at).toBe('2026-03-15T12:00:00.000Z')
    expect(next_state.last_grade).toBe(5)
  })

  it('uses six days on the second successful review', () => {
    const next_state = calculate_sm2_review_state({
      review_state: create_review_state({
        repetition: 1,
        interval_days: 1,
        easiness_factor: 2.5,
      }),
      grade: 4,
      now: TEST_NOW,
    })

    expect(next_state.easiness_factor).toBeCloseTo(2.5, 5)
    expect(next_state.repetition).toBe(2)
    expect(next_state.interval_days).toBe(6)
    expect(next_state.next_review_at).toBe('2026-03-21T12:00:00.000Z')
  })

  it('uses updated easiness factor from the third successful review onward', () => {
    const next_state = calculate_sm2_review_state({
      review_state: create_review_state({
        repetition: 2,
        interval_days: 6,
        easiness_factor: 2.5,
      }),
      grade: 3,
      now: TEST_NOW,
    })

    expect(next_state.easiness_factor).toBeCloseTo(2.36, 5)
    expect(next_state.repetition).toBe(3)
    expect(next_state.interval_days).toBe(14)
    expect(next_state.next_review_at).toBe('2026-03-29T12:00:00.000Z')
  })

  it('resets repetition and interval to one day for grades below 3', () => {
    const next_state = calculate_sm2_review_state({
      review_state: create_review_state({
        repetition: 5,
        interval_days: 30,
        easiness_factor: 2.5,
      }),
      grade: 2,
      now: TEST_NOW,
    })

    expect(next_state.easiness_factor).toBeCloseTo(2.18, 5)
    expect(next_state.repetition).toBe(0)
    expect(next_state.interval_days).toBe(1)
    expect(next_state.next_review_at).toBe('2026-03-16T12:00:00.000Z')
  })

  it('covers every grade from 0 to 5 and clamps easiness factor to 1.3', () => {
    const grades = [0, 1, 2, 3, 4, 5]

    for (const grade of grades) {
      const next_state = calculate_sm2_review_state({
        review_state: create_review_state({
          repetition: 3,
          interval_days: 10,
          easiness_factor: 1.3,
        }),
        grade,
        now: TEST_NOW,
      })

      expect(next_state.last_grade).toBe(grade)
      expect(next_state.last_review_at).toBe(TEST_NOW.toISOString())
      expect(next_state.easiness_factor).toBeGreaterThanOrEqual(1.3)
    }
  })

  it('maps repetition counts to fixed five memory levels', () => {
    expect(
      resolve_sm2_memory_level(
        create_review_state({
          repetition: 0,
          interval_days: 0,
          easiness_factor: 2.5,
        })
      )
    ).toBe(1)
    expect(
      resolve_sm2_memory_level(
        create_review_state({
          repetition: 1,
          interval_days: 1,
          easiness_factor: 2.5,
        })
      )
    ).toBe(2)
    expect(
      resolve_sm2_memory_level(
        create_review_state({
          repetition: 2,
          interval_days: 6,
          easiness_factor: 2.5,
        })
      )
    ).toBe(3)
    expect(
      resolve_sm2_memory_level(
        create_review_state({
          repetition: 3,
          interval_days: 14,
          easiness_factor: 2.5,
        })
      )
    ).toBe(4)
    expect(
      resolve_sm2_memory_level(
        create_review_state({
          repetition: 8,
          interval_days: 80,
          easiness_factor: 2.5,
        })
      )
    ).toBe(5)
  })
})

const create_review_state = (input: {
  repetition: number
  interval_days: number
  easiness_factor: number
}) => ({
  repetition: input.repetition,
  interval_days: input.interval_days,
  easiness_factor: input.easiness_factor,
  next_review_at: '2026-03-15T12:00:00.000Z',
  last_review_at: null,
  last_grade: null,
})
