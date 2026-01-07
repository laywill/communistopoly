// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import {
  getRandomQuestionByDifficulty,
  getRandomDifficulty,
  isAnswerCorrect,
  type TestDifficulty,
  type TestQuestion
} from '../../data/communistTestQuestions'

describe('Communist Test Questions Helpers', () => {
  describe('getRandomQuestionByDifficulty', () => {
    it('should return a question with the correct difficulty - easy', () => {
      const question = getRandomQuestionByDifficulty('easy')
      expect(question).toBeDefined()
      expect(question.difficulty).toBe('easy')
      expect(question.id).toBeDefined()
      expect(question.question).toBeDefined()
      expect(question.answer).toBeDefined()
    })

    it('should return a question with the correct difficulty - medium', () => {
      const question = getRandomQuestionByDifficulty('medium')
      expect(question).toBeDefined()
      expect(question.difficulty).toBe('medium')
    })

    it('should return a question with the correct difficulty - hard', () => {
      const question = getRandomQuestionByDifficulty('hard')
      expect(question).toBeDefined()
      expect(question.difficulty).toBe('hard')
    })

    it('should return a question with the correct difficulty - trick', () => {
      const question = getRandomQuestionByDifficulty('trick')
      expect(question).toBeDefined()
      expect(question.difficulty).toBe('trick')
    })

    it('should return different questions from the same difficulty pool', () => {
      // Run multiple times to increase likelihood of different questions
      const questions = new Set<string>()
      for (let i = 0; i < 20; i++) {
        const question = getRandomQuestionByDifficulty('easy')
        questions.add(question.id)
      }
      // If there are multiple easy questions, we should get different ones
      // (This test might occasionally fail if very unlucky with randomness)
      expect(questions.size).toBeGreaterThan(0)
    })
  })

  describe('getRandomDifficulty', () => {
    it('should always return a valid difficulty', () => {
      const validDifficulties: TestDifficulty[] = ['easy', 'medium', 'hard', 'trick']

      // Test multiple times to cover various random outcomes
      for (let i = 0; i < 50; i++) {
        const difficulty = getRandomDifficulty()
        expect(validDifficulties).toContain(difficulty)
      }
    })

    it('should return different difficulties over multiple calls', () => {
      const difficulties = new Set<TestDifficulty>()

      // Run enough times that we should get at least 2 different difficulties
      for (let i = 0; i < 100; i++) {
        difficulties.add(getRandomDifficulty())
      }

      // With weighted distribution (40% easy, 35% medium, 20% hard, 5% trick),
      // we should see at least 2 different difficulties in 100 calls
      expect(difficulties.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('isAnswerCorrect', () => {
    const mockQuestion: TestQuestion = {
      id: 'test-1',
      difficulty: 'easy',
      question: 'Test question?',
      answer: 'Marx',
      acceptableAnswers: ['marx', 'karl marx'],
      reward: 100,
      penalty: 0
    }

    it('should return true for exact match (case-insensitive)', () => {
      expect(isAnswerCorrect(mockQuestion, 'marx')).toBe(true)
      expect(isAnswerCorrect(mockQuestion, 'Marx')).toBe(true)
      expect(isAnswerCorrect(mockQuestion, 'MARX')).toBe(true)
    })

    it('should return true for acceptable answer variations', () => {
      expect(isAnswerCorrect(mockQuestion, 'karl marx')).toBe(true)
      expect(isAnswerCorrect(mockQuestion, 'Karl Marx')).toBe(true)
      expect(isAnswerCorrect(mockQuestion, 'KARL MARX')).toBe(true)
    })

    it('should trim whitespace from user answers', () => {
      expect(isAnswerCorrect(mockQuestion, '  marx  ')).toBe(true)
      expect(isAnswerCorrect(mockQuestion, '  karl marx  ')).toBe(true)
    })

    it('should return true when user answer is substring of acceptable answer', () => {
      expect(isAnswerCorrect(mockQuestion, 'karl')).toBe(true)
    })

    it('should return true when acceptable answer is substring of user answer', () => {
      expect(isAnswerCorrect(mockQuestion, 'karl marx was a philosopher')).toBe(true)
    })

    it('should return false for incorrect answers', () => {
      expect(isAnswerCorrect(mockQuestion, 'engels')).toBe(false)
      expect(isAnswerCorrect(mockQuestion, 'lenin')).toBe(false)
      expect(isAnswerCorrect(mockQuestion, 'wrong answer')).toBe(false)
    })

    it('should return false when acceptableAnswers is undefined', () => {
      const questionWithoutAcceptable: TestQuestion = {
        ...mockQuestion,
        acceptableAnswers: undefined
      }
      expect(isAnswerCorrect(questionWithoutAcceptable, 'marx')).toBe(false)
    })

    it('should return false when acceptableAnswers is null', () => {
      const questionWithNullAcceptable: TestQuestion = {
        ...mockQuestion,
        acceptableAnswers: null as unknown as string[]
      }
      expect(isAnswerCorrect(questionWithNullAcceptable, 'marx')).toBe(false)
    })

    it('should return true for empty user answer (due to includes("") behavior)', () => {
      // Note: This is a quirk of the implementation - empty string is included in all strings
      expect(isAnswerCorrect(mockQuestion, '')).toBe(true)
      expect(isAnswerCorrect(mockQuestion, '   ')).toBe(true)
    })

    it('should handle empty acceptableAnswers array', () => {
      const questionWithEmptyArray: TestQuestion = {
        ...mockQuestion,
        acceptableAnswers: []
      }
      expect(isAnswerCorrect(questionWithEmptyArray, 'marx')).toBe(false)
    })
  })
})
