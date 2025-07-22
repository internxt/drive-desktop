import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageIndicator } from '.';
import { Usage } from '@/apps/main/usage/Usage';
import { deepMocked, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { LocalContextProps, useTranslationContext } from '../../context/LocalContext';
import { mockDeep } from 'vitest-mock-extended';
import * as useGetUsage from '../../api/use-get-usage';

vi.mock(import('../../context/LocalContext'));

describe('UsageIndicator', () => {
  const mockuseTranslationContext = deepMocked(useTranslationContext);
  const mockedTranslationContext = mockDeep<LocalContextProps>();
  const mockUseUsage = partialSpyOn(useGetUsage, 'useGetUsage');

  const mockUsage: Usage = {
    usageInBytes: 500 * 1024 * 1024, // 500MB
    limitInBytes: 1024 * 1024 * 1024, // 1GB
    isInfinite: false,
    offerUpgrade: false,
  };
  beforeEach(() => {
    mockedTranslationContext.translate.mockReturnValue('of');
    mockuseTranslationContext.mockReturnValue(mockedTranslationContext);
  });

  describe('Loading State', () => {
    it('should display empty text when usage is undefined', () => {
      // Given: Usage is in loading state but usage is undefined
      mockUseUsage.mockReturnValue({ status: 'loading' });

      // When: Component renders
      const { container } = render(<UsageIndicator />);

      // Then: Should show empty text (usage is undefined)
      const element = container.querySelector('p');
      expect(element).toHaveTextContent('');
    });

    it('should display loading message when usage exists and status is loading', () => {
      // Given: Usage exists but status is loading
      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should show loading message
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('should display empty string when usage is undefined with error status', () => {
    // Given: Usage is undefined with error status
    mockUseUsage.mockReturnValue({
      data: undefined,
      status: 'error',
    });

    // When: Component renders
    const { container } = render(<UsageIndicator />);

    // Then: Should show empty text
    const element = container.querySelector('p');
    expect(element).toHaveTextContent('');
  });

  describe('Ready State with Finite Storage', () => {
    it('should display formatted usage with finite limit', () => {
      // Given: Usage is ready with finite storage
      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should display formatted usage
      expect(screen.getByText('500MB of 1GB')).toBeInTheDocument();
      expect(mockedTranslationContext.translate).toHaveBeenCalledWith('widget.header.usage.of');
    });

    it('should display zero usage correctly', () => {
      // Given: Usage is ready with zero usage
      const mockUsage: Usage = {
        usageInBytes: 0,
        limitInBytes: 2 * 1024 * 1024 * 1024, // 2GB
        isInfinite: false,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should display zero usage
      expect(screen.getByText('0B of 2GB')).toBeInTheDocument();
    });

    it('should handle large usage amounts correctly', () => {
      // Given: Usage is ready with large amounts
      const mockUsage: Usage = {
        usageInBytes: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
        limitInBytes: 5 * 1024 * 1024 * 1024 * 1024, // 5TB
        isInfinite: false,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should display formatted large usage
      expect(screen.getByText('2TB of 5TB')).toBeInTheDocument();
    });
  });

  describe('Ready State with Infinite Storage', () => {
    it('should display infinite symbol for unlimited storage', () => {
      // Given: Usage is ready with infinite storage
      const mockUsage: Usage = {
        usageInBytes: 750 * 1024 * 1024, // 750MB
        limitInBytes: 1024 * 1024 * 1024, // 1GB (ignored for infinite)
        isInfinite: true,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should display infinite symbol
      expect(screen.getByText('750MB of ∞')).toBeInTheDocument();
    });

    it('should handle zero usage with infinite storage', () => {
      // Given: Usage is ready with zero usage and infinite storage
      const mockUsage: Usage = {
        usageInBytes: 0,
        limitInBytes: 1024 * 1024 * 1024, // 1GB (ignored)
        isInfinite: true,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should display zero with infinite symbol
      expect(screen.getByText('0B of ∞')).toBeInTheDocument();
    });
  });

  describe('Translation Integration', () => {
    it('should use translated "of" text', () => {
      // Given: Custom translation for "of"
      mockedTranslationContext.translate.mockReturnValue('de');

      const mockUsage: Usage = {
        usageInBytes: 100 * 1024 * 1024, // 100MB
        limitInBytes: 1024 * 1024 * 1024, // 1GB
        isInfinite: false,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should use translated text
      expect(screen.getByText('100MB de 1GB')).toBeInTheDocument();
      expect(mockedTranslationContext.translate).toHaveBeenCalledWith('widget.header.usage.of');
    });
  });

  describe('State Changes', () => {
    it('should update display when usage changes', () => {
      // Given: Initial usage state
      const initialUsage: Usage = {
        usageInBytes: 100 * 1024 * 1024, // 100MB
        limitInBytes: 1024 * 1024 * 1024, // 1GB
        isInfinite: false,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: initialUsage,
        status: 'success',
      });

      const { rerender } = render(<UsageIndicator />);

      // Verify initial state
      expect(screen.getByText('100MB of 1GB')).toBeInTheDocument();

      // When: Usage updates
      const updatedUsage: Usage = {
        usageInBytes: 200 * 1024 * 1024, // 200MB
        limitInBytes: 1024 * 1024 * 1024, // 1GB
        isInfinite: false,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: updatedUsage,
        status: 'success',
      });

      rerender(<UsageIndicator />);

      // Then: Should display updated usage
      expect(screen.getByText('200MB of 1GB')).toBeInTheDocument();
    });

    it('should update display when status changes', () => {
      // Given: Initial loading state with undefined usage
      mockUseUsage.mockReturnValue({
        data: undefined,
        status: 'loading',
      });

      const { rerender, container } = render(<UsageIndicator />);

      // Verify initial state shows empty (usage is undefined)
      const element = container.querySelector('p');
      expect(element).toHaveTextContent('');

      // When: Status changes to ready with actual usage
      const mockUsage: Usage = {
        usageInBytes: 300 * 1024 * 1024, // 300MB
        limitInBytes: 1024 * 1024 * 1024, // 1GB
        isInfinite: false,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      rerender(<UsageIndicator />);

      // Then: Should display usage data
      expect(screen.getByText('300MB of 1GB')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers correctly', () => {
      // Given: Usage with very large numbers
      const mockUsage: Usage = {
        usageInBytes: 1024 * 1024 * 1024 * 1024, // 1TB
        limitInBytes: 5 * 1024 * 1024 * 1024 * 1024, // 5TB
        isInfinite: false,
        offerUpgrade: false,
      };

      mockUseUsage.mockReturnValue({
        data: mockUsage,
        status: 'success',
      });

      // When: Component renders
      render(<UsageIndicator />);

      // Then: Should display formatted large numbers
      expect(screen.getByText('1TB of 5TB')).toBeInTheDocument();
    });
  });
});
