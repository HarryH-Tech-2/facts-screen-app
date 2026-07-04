import factsJson from '../data/facts.json';

export interface Fact {
  id: string;
  category: string;
  text: string;
}

export const CATEGORIES = [
  'Science',
  'History',
  'Space',
  'Animals',
  'Geography',
  'Human Body',
] as const;

export const FACTS: Fact[] = factsJson;
