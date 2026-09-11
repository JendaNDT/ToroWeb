// Reproduce the audit of 2026-09-11. Run npm run test:room first to compile the domain modules.
// This script does not change application data. Nonzero exit means audit findings remain.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.resolve('.sites-runtime/room-tests/package.json'));
const room = require('./room.js');
const { createTemplate } = require('./toro-templates.js');
const { buildFurniture } = require('./room-model.js');
const { disposeGroup } = require('./wardrobe-model.js');
const { describeDesign } = require('./toro-inquiry.js');
const THREE = require('three');
const base = room.upgradeDesign(createTemplate('hall'));
let cases = 0;
const invalidNormalizations = [];
for (const { type } of room.catalog) {
  for (const width of [30, 40, 70, 100, 110, 199, 240, 350, 499, 500]) {
    for (const height of [2, 30, 85, 160, 220, 268, 400]) {
      for (const depth of [3, 15, 40, 65, 100]) {
        const item = room.normalizeItem({ ...room.newFurniture(type, base.room, 'audit'), width, height, depth }, base.room);
        cases++;
        if (!room.roomDesignSchema.safeParse({ ...base, items: [item] }).success) invalidNormalizations.push(item);
      }
    }
  }
}

const point = { id: 'fraction', type: 'socket', name: 'Testovací zásuvka', wall: 'north', offset: 416.95, elevation: 30, width: 6.1, height: 8 };
const imported = { ...base, title: 'AUDIT – desetinná zásuvka', technicalPoints: [point] };
const migrated = room.parseDesign(imported);
const fractionalSocket = {
  inputValid: room.roomDesignSchema.safeParse(imported).success,
  before: point,
  after: migrated.technicalPoints[0],
  outputValid: room.roomDesignSchema.safeParse(migrated).success,
};

const boundaryRoom = { ...base.room, openings: [] };
const geometry = room.catalog.map(({ type }) => {
  const item = room.placeItem(room.newFurniture(type, boundaryRoom, 'audit'), boundaryRoom, 0, 999);
  const model = buildFurniture(item, null, true);
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const result = {
    type,
    declaredDepthCm: item.depth,
    meshDepthCm: Math.round((bounds.max.z - bounds.min.z) * 1000) / 10,
    beyondWallCm: Math.round((bounds.max.z * 100 - boundaryRoom.length / 2) * 10) / 10,
    warnings: room.issuesFor({ ...base, room: boundaryRoom, items: [item] }).map(issue => issue.kind),
  };
  disposeGroup(model);
  return result;
});

const overlap = { ...base, items: [base.items[0], { ...base.items[0], id: 'overlap' }] };
const warnings = room.issuesFor(overlap).map(issue => issue.text);
const textExport = { warnings, presentInText: warnings.every(warning => describeDesign(overlap).includes(warning)) };
const failures = [
  ...invalidNormalizations.length ? ['Invalid normalized furniture'] : [],
  ...!fractionalSocket.outputValid ? ['A01: accepted socket becomes invalid after migration'] : [],
  ...geometry.some(row => row.beyondWallCm > .1 && !row.warnings.includes('outside')) ? ['A03: physical model protrudes through a wall without warning'] : [],
  ...!textExport.presentInText ? ['A07: text export omits collision warnings'] : [],
];
const report = { normalizationCases: cases, invalidNormalizations, fractionalSocket, geometry, textExport, failures };
fs.mkdirSync('.sites-runtime/audit', { recursive: true });
fs.writeFileSync('.sites-runtime/audit/extended-checks.json', JSON.stringify(report, null, 2));
fs.writeFileSync('.sites-runtime/audit/fractional-socket.json', JSON.stringify(imported, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
