import { describe, it, expect, vi, beforeEach } from 'vitest';
import { predictDrugAndOutcome } from '../geminiService';

// Mock the GoogleGenAI SDK
vi.mock('@google/genai', () => {
  const generateContentMock = vi.fn().mockResolvedValue({
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
  });

  const GoogleGenAIMock = vi.fn(function () {
    return {
      models: {
        generateContent: generateContentMock
      }
    };
  });

  return {
    GoogleGenAI: GoogleGenAIMock,
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING',
      NUMBER: 'NUMBER'
    }
  };
});

describe('geminiService', () => {
  beforeEach(async () => {
    const { GoogleGenAI } = await import('@google/genai');
    // @ts-ignore
    GoogleGenAI.mockClear();
  });

  it('predictDrugAndOutcome returns parsed AI response', async () => {
    const result = await predictDrugAndOutcome('Mock data summary');
    
    expect(result.disease).toBe('Lung Adenocarcinoma');
    expect(result.recommendedDrugs[0].name).toBe('Osimertinib');
    expect(result.riskAssessment).toContain('High risk');
  });

  it('throws error if AI response is invalid JSON', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    // @ts-ignore
    const firstInstance = GoogleGenAI.mock.results[0]?.value ?? new GoogleGenAI({ apiKey: '' });
    // @ts-ignore
    firstInstance.models.generateContent.mockResolvedValueOnce({ text: 'invalid json' });

    await expect(predictDrugAndOutcome('bad data')).rejects.toThrow('Invalid cancer analysis format.');
  });
});
