type Vector = readonly [number, number, number];

export interface DieFace {
  normal: Vector;
  vertical: Vector;
  transform: string;
  polygon: string;
}

const add = (a: Vector, b: Vector): Vector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subtract = (a: Vector, b: Vector): Vector => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const multiply = (a: Vector, amount: number): Vector => [a[0] * amount, a[1] * amount, a[2] * amount];
const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vector, b: Vector): Vector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vector) => Math.hypot(...a);
const normalize = (a: Vector): Vector => multiply(a, 1 / (length(a) || 1));
const average = (points: Vector[]): Vector => multiply(points.reduce(add, [0, 0, 0]), 1 / points.length);

interface Polyhedron {
  vertices: Vector[];
  faces: number[][];
}

const triangularHull = (vertices: Vector[]): number[][] => {
  const faces: number[][] = [];
  for (let a = 0; a < vertices.length; a += 1) {
    for (let b = a + 1; b < vertices.length; b += 1) {
      for (let c = b + 1; c < vertices.length; c += 1) {
        const normal = cross(subtract(vertices[b], vertices[a]), subtract(vertices[c], vertices[a]));
        if (length(normal) < 1e-6) continue;
        let positive = false;
        let negative = false;
        for (let other = 0; other < vertices.length; other += 1) {
          if (other === a || other === b || other === c) continue;
          const side = dot(normal, subtract(vertices[other], vertices[a]));
          if (side > 1e-6) positive = true;
          if (side < -1e-6) negative = true;
        }
        if (!positive || !negative) faces.push([a, b, c]);
      }
    }
  }
  return faces;
};

const icosahedron = (): Polyhedron => {
  const golden = (1 + Math.sqrt(5)) / 2;
  const vertices: Vector[] = [
    [0, -1, -golden], [0, -1, golden], [0, 1, -golden], [0, 1, golden],
    [-1, -golden, 0], [-1, golden, 0], [1, -golden, 0], [1, golden, 0],
    [-golden, 0, -1], [golden, 0, -1], [-golden, 0, 1], [golden, 0, 1],
  ];
  return { vertices, faces: triangularHull(vertices) };
};

const dual = ({ vertices, faces }: Polyhedron): Polyhedron => {
  const dualVertices = faces.map((indices) => {
    const points = indices.map((index) => vertices[index]);
    let normal = normalize(cross(subtract(points[1], points[0]), subtract(points[2], points[0])));
    const center = average(points);
    if (dot(normal, center) < 0) normal = multiply(normal, -1);
    return multiply(normal, 1 / dot(normal, center));
  });

  const dualFaces = vertices.map((vertex, vertexIndex) => {
    const adjacent = faces.flatMap((indices, index) => indices.includes(vertexIndex) ? [index] : []);
    const normal = normalize(vertex);
    const reference = Math.abs(normal[2]) < .9 ? [0, 0, 1] as Vector : [0, 1, 0] as Vector;
    const horizontal = normalize(cross(reference, normal));
    const vertical = cross(normal, horizontal);
    const center = average(adjacent.map((index) => dualVertices[index]));
    return adjacent.sort((a, b) => {
      const angle = (index: number) => {
        const offset = subtract(dualVertices[index], center);
        return Math.atan2(dot(offset, vertical), dot(offset, horizontal));
      };
      return angle(a) - angle(b);
    });
  });

  return { vertices: dualVertices, faces: dualFaces };
};

const pentagonalAntiprism = (): Polyhedron => {
  const vertices: Vector[] = [];
  for (let index = 0; index < 5; index += 1) {
    const top = 2 * Math.PI * index / 5;
    const bottom = top + Math.PI / 5;
    vertices.push([Math.cos(top), Math.sin(top), .62]);
    vertices.push([Math.cos(bottom), Math.sin(bottom), -.62]);
  }
  const faces: number[][] = [
    [0, 2, 4, 6, 8], [1, 3, 5, 7, 9],
  ];
  for (let index = 0; index < 5; index += 1) {
    const next = (index + 1) % 5;
    faces.push([index * 2, index * 2 + 1, next * 2]);
    faces.push([index * 2 + 1, next * 2 + 1, next * 2]);
  }
  return { vertices, faces };
};

const shapeFor = (faces: number): Polyhedron => {
  if (faces === 4) {
    const vertices: Vector[] = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
    return { vertices, faces: triangularHull(vertices) };
  }
  if (faces === 8) {
    const vertices: Vector[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    return { vertices, faces: triangularHull(vertices) };
  }
  if (faces === 10) return dual(pentagonalAntiprism());
  if (faces === 12) return dual(icosahedron());
  if (faces === 20) return icosahedron();
  return {
    vertices: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
    faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 4, 5, 1],
      [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]],
  };
};

export const getDieFaces = (faces: number, size: number): DieFace[] => {
  const shape = shapeFor(faces);
  const radius = Math.max(...shape.vertices.map(length));
  const vertices = shape.vertices.map((vertex) => multiply(vertex, 1 / radius));
  return shape.faces.map((indices) => {
    const points = indices.map((index) => vertices[index]);
    const center = average(points);
    const horizontal = normalize(subtract(points[1], points[0]));
    let normal = normalize(cross(subtract(points[1], points[0]), subtract(points[2], points[0])));
    if (dot(normal, center) < 0) normal = multiply(normal, -1);
    const vertical = cross(normal, horizontal);
    const polygon = points.map((point) => {
      const offset = subtract(point, center);
      return `${(50 + dot(offset, horizontal) * 50).toFixed(2)},${(50 + dot(offset, vertical) * 50).toFixed(2)}`;
    }).join(' ');
    const position = multiply(center, size / 2);
    const matrix = [
      ...horizontal, 0, ...vertical, 0, ...normal, 0, ...position, 1,
    ].map((value) => Number(value.toFixed(6))).join(',');
    return { normal, vertical, polygon, transform: `matrix3d(${matrix})` };
  });
};

export type Quaternion = readonly [number, number, number, number];
export const identity: Quaternion = [0, 0, 0, 1];

export const quaternionAxis = (axis: Vector, radians: number): Quaternion => {
  const unit = normalize(axis);
  const half = radians / 2;
  return [unit[0] * Math.sin(half), unit[1] * Math.sin(half), unit[2] * Math.sin(half), Math.cos(half)];
};

export const quaternionMultiply = (a: Quaternion, b: Quaternion): Quaternion => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

export const quaternionNormalize = (q: Quaternion): Quaternion => {
  const magnitude = Math.hypot(...q);
  return [q[0] / magnitude, q[1] / magnitude, q[2] / magnitude, q[3] / magnitude];
};

export const quaternionRotate = (q: Quaternion, vector: Vector): Vector => {
  const direction = [q[0], q[1], q[2]] as Vector;
  const t = multiply(cross(direction, vector), 2);
  return add(vector, add(multiply(t, q[3]), cross(direction, t)));
};

export const quaternionToFace = ({ normal, vertical }: DieFace): Quaternion => {
  const forward: Vector = [0, 0, 1];
  const axis = cross(normal, forward);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(normal, forward))));
  const faceForward = length(axis) < 1e-6
    ? (dot(normal, forward) > 0 ? identity : quaternionAxis([0, 1, 0], Math.PI))
    : quaternionAxis(axis, angle);
  const faceDown = quaternionRotate(faceForward, vertical);
  const upright = quaternionAxis(forward, Math.atan2(faceDown[0], faceDown[1]));
  return quaternionNormalize(quaternionMultiply(upright, faceForward));
};

export const quaternionSlerp = (from: Quaternion, to: Quaternion, amount: number): Quaternion => {
  let target = to;
  let similarity = from.reduce((sum, value, index) => sum + value * to[index], 0);
  if (similarity < 0) {
    target = [-to[0], -to[1], -to[2], -to[3]];
    similarity = -similarity;
  }
  if (similarity > .9995) {
    return quaternionNormalize(from.map((value, index) => value + amount * (target[index] - value)) as unknown as Quaternion);
  }
  const angle = Math.acos(Math.min(1, similarity));
  const sine = Math.sin(angle);
  const first = Math.sin((1 - amount) * angle) / sine;
  const second = Math.sin(amount * angle) / sine;
  return [
    first * from[0] + second * target[0],
    first * from[1] + second * target[1],
    first * from[2] + second * target[2],
    first * from[3] + second * target[3],
  ];
};

export const quaternionMatrix = (q: Quaternion): string => {
  const [x, y, z, w] = q;
  const values = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    0, 0, 0, 1,
  ];
  return `matrix3d(${values.map((value) => Number(value.toFixed(6))).join(',')})`;
};
