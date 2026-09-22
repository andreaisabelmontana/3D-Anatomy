import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodeStudyList, encodeStudyList, readStudyList, structureKey, writeStudyList} from '../app/study-list.ts';

const atlas = JSON.parse(await readFile(new URL('../public/models/atlas.json', import.meta.url)));
const group = atlas.concepts.find(concept => concept.elements.length > 1);
const single = {id: group.id, name: 'untrusted label', elements: [group.elements[0]]};
const restored = decodeStudyList(encodeStudyList([group, single]), atlas);
assert.deepEqual(restored.map(structureKey), [group, single].map(structureKey));
assert.equal(restored[1].name, group.name);
assert.ok(!encodeStudyList([single]).includes('untrusted label'));
const parts = new Map(atlas.parts.map(part => [part.id, part]));
const singlePieceAlias = atlas.concepts.find(concept => concept.elements.length === 1 &&
  concept.name.toLowerCase() !== parts.get(concept.elements[0]).name.toLowerCase());
assert.ok(singlePieceAlias, 'The real atlas includes a concept label distinct from its single mesh');
assert.equal(decodeStudyList(encodeStudyList([singlePieceAlias]), atlas)[0].name, singlePieceAlias.name);

for (const invalid of [null, '', '{invalid', 'null', '{}', '[]', '{"version":2,"structures":[]}']) {
  assert.deepEqual(decodeStudyList(invalid, atlas), []);
}
const mixed = {version: 1, structures: [
  single,
  {...single, elements: [...single.elements, ...single.elements]},
  {id: 'retired-id', elements: single.elements},
  {...single, elements: ['missing-piece']},
  {...single, elements: []},
  {...single, elements: [null]},
  null,
]};
assert.deepEqual(decodeStudyList(JSON.stringify(mixed), atlas).map(structureKey), [structureKey(single)]);
assert.equal(structureKey(group), structureKey({...group, elements: [...group.elements].reverse()}));
assert.deepEqual(readStudyList(atlas, () => {throw new Error('blocked');}), {structures: [], available: false});
assert.equal(writeStudyList([single], () => {throw new Error('quota');}), false);
let stored;
assert.equal(writeStudyList([single], value => {stored = value;}), true);
assert.equal(readStudyList(atlas, () => stored).structures.length, 1);
console.log('Study list: exact selections, canonical labels, duplicates, corrupt/stale data, and blocked/full storage passed.');
