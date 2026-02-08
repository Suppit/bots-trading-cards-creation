import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Returns true if the text contains inappropriate language.
 * Uses the `obscenity` library which handles common evasion tactics
 * like leet speak ($, @, 0, 1 substitutions) and symbol tricks.
 */
export function containsProfanity(text: string): boolean {
  if (!text.trim()) return false;
  return matcher.hasMatch(text);
}
