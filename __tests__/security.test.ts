/**
 * Security Tests for ALX Polly
 * Tests for vulnerabilities and security fixes
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabaseClient),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { createPoll, submitVote, deletePoll } from '@/app/lib/actions/poll-actions';

describe('Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation Tests', () => {
    it('should reject XSS attempts in poll creation', async () => {
      const formData = new FormData();
      formData.append('question', '<script>alert("xss")</script>What is your favorite color?');
      formData.append('options', 'Red');
      formData.append('options', '<img src=x onerror=alert("xss")>Blue');

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from().insert.mockResolvedValue({ error: null });

      const result = await createPoll(formData);

      expect(result.error).toBeNull();
      
      // Verify that the insert was called with sanitized data
      const insertCall = mockSupabaseClient.from().insert.mock.calls[0][0][0];
      expect(insertCall.question).not.toContain('<script>');
      expect(insertCall.question).toContain('&lt;script&gt;');
      expect(insertCall.options[1]).not.toContain('<img');
      expect(insertCall.options[1]).toContain('&lt;img');
    });

    it('should reject polls with invalid input lengths', async () => {
      const formData = new FormData();
      formData.append('question', 'a'.repeat(501)); // Too long
      formData.append('options', 'Option 1');
      formData.append('options', 'Option 2');

      const result = await createPoll(formData);
      expect(result.error).toContain('Question must be less than 500 characters');
    });

    it('should reject polls with insufficient options', async () => {
      const formData = new FormData();
      formData.append('question', 'Valid question?');
      formData.append('options', 'Only one option');

      const result = await createPoll(formData);
      expect(result.error).toContain('At least 2 options are required');
    });

    it('should reject polls with too many options', async () => {
      const formData = new FormData();
      formData.append('question', 'Valid question?');
      
      // Add 11 options (max is 10)
      for (let i = 1; i <= 11; i++) {
        formData.append('options', `Option ${i}`);
      }

      const result = await createPoll(formData);
      expect(result.error).toContain('Maximum 10 options allowed');
    });
  });

  describe('Authentication Tests', () => {
    it('should reject poll creation from unauthenticated users', async () => {
      const formData = new FormData();
      formData.append('question', 'Valid question?');
      formData.append('options', 'Option 1');
      formData.append('options', 'Option 2');

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await createPoll(formData);
      expect(result.error).toBe('You must be logged in to create a poll.');
    });
  });

  describe('Authorization Tests', () => {
    it('should prevent users from deleting polls they do not own', async () => {
      const pollId = 'poll123';
      
      // Mock user who is not the owner and not admin
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user456', email: 'notowner@example.com' } },
        error: null,
      });

      // Mock poll owned by different user
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { user_id: 'user123' },
        error: null,
      });

      const result = await deletePoll(pollId);
      expect(result.error).toBe('You can only delete your own polls.');
    });

    it('should allow admins to delete any poll', async () => {
      const pollId = 'poll123';
      
      // Mock admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin123', email: 'admin@example.com' } },
        error: null,
      });

      // Mock poll owned by different user
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { user_id: 'user123' },
        error: null,
      });

      mockSupabaseClient.from().delete().eq.mockResolvedValue({ error: null });

      const result = await deletePoll(pollId);
      expect(result.error).toBeNull();
    });
  });

  describe('Double Voting Prevention Tests', () => {
    it('should prevent authenticated users from voting twice', async () => {
      const pollId = 'poll123';
      const optionIndex = 0;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      });

      // Mock poll exists
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: { id: pollId, options: ['Option 1', 'Option 2'] },
          error: null,
        })
        // Mock existing vote found
        .mockResolvedValueOnce({
          data: { id: 'vote123' },
          error: null,
        });

      const result = await submitVote(pollId, optionIndex);
      expect(result.error).toBe('You have already voted on this poll.');
    });

    it('should allow voting when user has not voted before', async () => {
      const pollId = 'poll123';
      const optionIndex = 0;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      });

      // Mock poll exists
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: { id: pollId, options: ['Option 1', 'Option 2'] },
          error: null,
        })
        // Mock no existing vote found
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      mockSupabaseClient.from().insert.mockResolvedValue({ error: null });

      const result = await submitVote(pollId, optionIndex);
      expect(result.error).toBeNull();
    });

    it('should reject invalid option indices', async () => {
      const pollId = 'poll123';
      const invalidOptionIndex = 5; // Poll only has 2 options

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      });

      // Mock poll exists with 2 options
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { id: pollId, options: ['Option 1', 'Option 2'] },
        error: null,
      });

      const result = await submitVote(pollId, invalidOptionIndex);
      expect(result.error).toBe('Invalid option selected.');
    });
  });

  describe('Data Validation Tests', () => {
    it('should reject invalid UUID format for poll ID', async () => {
      const invalidPollId = 'not-a-uuid';
      const optionIndex = 0;

      const result = await submitVote(invalidPollId, optionIndex);
      expect(result.error).toContain('Invalid poll ID');
    });

    it('should reject negative option indices', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000';
      const negativeOptionIndex = -1;

      const result = await submitVote(pollId, negativeOptionIndex);
      expect(result.error).toContain('Expected number, received nan');
    });
  });
});
