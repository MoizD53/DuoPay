import { describe, it, expect } from 'vitest';
import { validateSplitsExact, calculateSmartSettlements } from './engine';

describe('Finance Engine', () => {
  describe('validateSplitsExact', () => {
    it('should pass if sum matches exactly', () => {
      const splits = [
        { userId: '1', amountMinor: 800, splitType: 'EQUAL' as const },
        { userId: '2', amountMinor: 800, splitType: 'EQUAL' as const },
        { userId: '3', amountMinor: 800, splitType: 'EQUAL' as const },
      ];
      
      expect(() => validateSplitsExact(2400, splits)).not.toThrow();
    });

    it('should throw if sum is off by 1 unit', () => {
      const splits = [
        { userId: '1', amountMinor: 800, splitType: 'EQUAL' as const },
        { userId: '2', amountMinor: 800, splitType: 'EQUAL' as const },
        { userId: '3', amountMinor: 801, splitType: 'EQUAL' as const },
      ];
      
      expect(() => validateSplitsExact(2400, splits)).toThrow(/Split validation failed/);
    });

    it('should throw if sum is completely wrong', () => {
      const splits = [
        { userId: '1', amountMinor: 1000, splitType: 'EQUAL' as const },
      ];
      
      expect(() => validateSplitsExact(2400, splits)).toThrow();
    });
  });

  describe('calculateSmartSettlements', () => {
    it('should minimize transactions for a simple chain', () => {
      // A owes B 500, B owes C 500 => A should owe C 500
      const balances = {
        'A': -500,
        'B': 0, // net zero
        'C': 500
      };

      const settlements = calculateSmartSettlements(balances);
      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toEqual({
        payerId: 'A',
        receiverId: 'C',
        amountMinor: 500,
      });
    });

    it('should handle complex settlement', () => {
      // Moiz pays 2400. Hatim owes 800, Ali owes 800.
      // Balances: Moiz: 1600 (owed), Hatim: -800 (owes), Ali: -800 (owes)
      const balances = {
        'Moiz': 1600,
        'Hatim': -800,
        'Ali': -800
      };

      const settlements = calculateSmartSettlements(balances);
      expect(settlements).toHaveLength(2);
      
      const hatimSettlement = settlements.find(s => s.payerId === 'Hatim');
      expect(hatimSettlement?.receiverId).toBe('Moiz');
      expect(hatimSettlement?.amountMinor).toBe(800);

      const aliSettlement = settlements.find(s => s.payerId === 'Ali');
      expect(aliSettlement?.receiverId).toBe('Moiz');
      expect(aliSettlement?.amountMinor).toBe(800);
    });
    
    it('should handle circular debts correctly', () => {
      // A owes B 100, B owes C 100, C owes A 100 => All balances 0
      const balances = {
        'A': 0,
        'B': 0,
        'C': 0
      };

      const settlements = calculateSmartSettlements(balances);
      expect(settlements).toHaveLength(0);
    });
  });
});
