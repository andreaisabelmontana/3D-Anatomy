import type {Atlas, Concept} from './anatomy';

export const STUDY_LIST_KEY = '3d-anatomy:study-list:v1';

export function structureKey(concept: Pick<Concept, 'id'|'elements'>): string {
  return JSON.stringify([concept.id, [...concept.elements].sort()]);
}

// Store identifiers only; always recover labels and validate geometry from the atlas.
export function decodeStudyList(serialized: string|null, atlas: Atlas): Concept[] {
  if (!serialized) return [];
  try {
    const data: unknown = JSON.parse(serialized);
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 ||
        !('structures' in data) || !Array.isArray(data.structures)) return [];
    const concepts = new Map(atlas.concepts.map(concept => [concept.id, concept]));
    const parts = new Map(atlas.parts.map(part => [part.id, part]));
    const seen = new Set<string>();
    const saved: Concept[] = [];
    for (const entry of data.structures) {
      if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' ||
          !Array.isArray(entry.elements) || entry.elements.length === 0) continue;
      const concept = concepts.get(entry.id);
      if (!concept || !entry.elements.every((id: unknown) => typeof id === 'string' &&
          parts.has(id) && concept.elements.includes(id))) continue;
      const elements = [...new Set<string>(entry.elements)];
      const restored = {
        id: concept.id,
        name: concept.name,
        elements,
      };
      const key = structureKey(restored);
      if (!seen.has(key)) { saved.push(restored); seen.add(key); }
    }
    return saved;
  } catch {
    return [];
  }
}

export function encodeStudyList(structures: Concept[]): string {
  return JSON.stringify({version: 1, structures: structures.map(({id, elements}) => ({id, elements}))});
}

export function readStudyList(atlas: Atlas, read: () => string|null): {structures: Concept[]; available: boolean} {
  try { return {structures: decodeStudyList(read(), atlas), available: true}; }
  catch { return {structures: [], available: false}; }
}

export function writeStudyList(structures: Concept[], write: (value: string) => void): boolean {
  try { write(encodeStudyList(structures)); return true; }
  catch { return false; }
}
