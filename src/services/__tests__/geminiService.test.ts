import { describe, it, expect, vi, beforeEach } from 'vitest';
import { predictDrugAndOutcome } from '../geminiService';

// Mock the GoogleGenAI SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            disease: 'Lung Adenocarcinoma',
            recommendedDrugs: [
              {
                name: 'Osimertinib',
                mechanism: 'EGFR TKI',
                confidence: 0.95,
                potentialOutcome: 'Improved survival',
                evidenceLevel: 'Tier I',
                fdaStatus: 'Approved'
              }
            ],
            riskAssessment: 'High risk due to EGFR T790M mutation',
            suggestedNextSteps: ['Monitor for resistance']
          })
        })
      }
    })),
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING',
      NUMBER: 'NUMBER'
    }
  };
});

describe('geminiService', () => {
  it('predictDrugAndOutcome returns parsed AI response', async () => {
    const result = await predictDrugAndOutcome('Mock data summary');
    
    expect(result.disease).toBe('Lung Adenocarcinoma');
    expect(result.recommendedDrugs[0].name).toBe('Osimertinib');
    expect(result.riskAssessment).toContain('High risk');
  });

  it('throws error if AI response is invalid JSON', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const mockAi = new GoogleGenAI({ apiKey: '' });
    // @ts-ignore
    mockAi.models.generateContent.mockResolvedValueOnce({ text: 'invalid json' });

    await expect(predictDrugAndOutcome('bad data')).rejects.toThrow('Invalid prediction format received from AI.');
  });
});
