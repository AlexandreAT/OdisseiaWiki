import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/components/Gameplay/DiceRollOverlay/dieGeometry.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const geometry = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
// CSS matrix3d values are rounded to six decimal places by dieGeometry.
const near = (actual, expected, tolerance = 3e-6) => Math.abs(actual - expected) < tolerance;
const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const matrixValues = (transform) => {
  assert.match(transform, /^matrix3d\([\d.,\s-]+\)$/);
  const values = transform.slice('matrix3d('.length, -1).split(',').map(Number);
  assert.equal(values.length, 16);
  return values;
};

for (const sides of [4, 6, 8, 10, 12, 20]) {
  test(`D${sides} has ${sides} 3D faces and can settle each face toward the camera`, () => {
    const faces = geometry.getDieFaces(sides, 112);
    assert.equal(faces.length, sides);
    for (const [index, face] of faces.entries()) {
      assert.equal(face.polygon.split(' ').length >= 3, true);
      const faceMatrix = matrixValues(face.transform);
      const horizontal = faceMatrix.slice(0, 3);
      const vertical = faceMatrix.slice(4, 7);
      const cssNormal = faceMatrix.slice(8, 11);
      const windingNormal = cross(horizontal, vertical);
      for (let axis = 0; axis < 3; axis += 1) {
        assert.ok(near(cssNormal[axis], face.normal[axis]), `D${sides} face ${index + 1}: CSS normal`);
        assert.ok(near(windingNormal[axis], face.normal[axis]), `D${sides} face ${index + 1}: CSS winding`);
      }
      const rotation = geometry.quaternionToFace(face);
      const oriented = geometry.quaternionRotate(rotation, face.normal);
      assert.ok(near(oriented[0], 0));
      assert.ok(near(oriented[1], 0));
      assert.ok(near(oriented[2], 1));
      const orientedVertical = geometry.quaternionRotate(rotation, face.vertical);
      assert.ok(near(orientedVertical[0], 0));
      assert.ok(near(orientedVertical[1], 1));
      assert.ok(near(orientedVertical[2], 0));
      const rotationMatrix = matrixValues(geometry.quaternionMatrix(rotation));
      const rotateByCss = (normal) => [0, 1, 2].map((axis) =>
        rotationMatrix[axis] * normal[0]
          + rotationMatrix[axis + 4] * normal[1]
          + rotationMatrix[axis + 8] * normal[2]);
      const cssOriented = rotateByCss(cssNormal);
      assert.ok(near(cssOriented[0], 0));
      assert.ok(near(cssOriented[1], 0));
      assert.ok(near(cssOriented[2], 1));
      for (const [otherIndex, other] of faces.entries()) {
        if (otherIndex === index) continue;
        assert.ok(dot(geometry.quaternionRotate(rotation, other.normal), [0, 0, 1]) < 1 - 1e-5,
          `D${sides}: face ${otherIndex + 1} must not be as front-facing as face ${index + 1}`);
      }
    }
  });
}
