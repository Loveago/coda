// Dependency-free QR Code encoder (byte mode, versions 1-40).
// Implements the ISO/IEC 18004 algorithm following the well-known
// MIT-licensed "QR-Code-generator" reference implementation.

export type QrEccLevel = 'L' | 'M' | 'Q' | 'H';

const ECC_FORMAT_BITS: Record<QrEccLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

// prettier-ignore
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  // 0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36  37  38  39  40
  [-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 26, 26, 26, 26, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
];

// prettier-ignore
const NUM_ECC_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
];

function getNumRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function getNumDataCodewords(version: number, ecc: QrEccLevel): number {
  const index = { L: 0, M: 1, Q: 2, H: 3 }[ecc];
  return (
    Math.floor(getNumRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[index][version] * NUM_ECC_BLOCKS[index][version]
  );
}

function getCharCountBits(version: number): number {
  return version <= 9 ? 8 : 16; // byte mode
}

function alignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step =
    version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result: number[] = [6];
  for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

// --- Reed-Solomon over GF(2^8) ---

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function reedSolomonComputeDivisor(degree: number): number[] {
  const result: number[] = new Array(degree).fill(0);
  result[degree - 1] = 1; // leading coefficient
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMul(coef, factor);
    });
  }
  return result;
}

function getBit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

// --- Public API ---

/** Encodes text into a QR code matrix (true = dark module). */
export function encodeQr(text: string, ecc: QrEccLevel = 'M'): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 1;
  for (; version <= 40; version++) {
    const capacityBits = getNumDataCodewords(version, ecc) * 8;
    const usedBits = 4 + getCharCountBits(version) + bytes.length * 8;
    if (usedBits <= capacityBits) break;
  }
  if (version > 40) throw new Error('QR payload too long');

  // Bit buffer: mode indicator (byte mode), char count, data bytes.
  const bits: number[] = [];
  const pushBits = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  pushBits(0b0100, 4);
  pushBits(bytes.length, getCharCountBits(version));
  bytes.forEach((b) => pushBits(b, 8));

  const dataCapacityBits = getNumDataCodewords(version, ecc) * 8;
  pushBits(0, Math.min(4, dataCapacityBits - bits.length)); // terminator
  pushBits(0, (8 - (bits.length % 8)) % 8); // byte alignment
  for (let pad = 0xec; bits.length < dataCapacityBits; pad ^= 0xec ^ 0x11) {
    pushBits(pad, 8);
  }

  const dataWords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let word = 0;
    for (let j = 0; j < 8; j++) word = (word << 1) | bits[i + j];
    dataWords.push(word);
  }

  const codewords = addEccAndInterleave(dataWords, version, ecc);
  const size = version * 4 + 17;

  let best: boolean[][] | null = null;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const matrix = buildMatrix(size, version, codewords, mask, ecc);
    const penalty = penaltyScore(matrix);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = matrix;
    }
  }
  return best as boolean[][];
}

function addEccAndInterleave(data: number[], version: number, ecc: QrEccLevel): number[] {
  const index = { L: 0, M: 1, Q: 2, H: 3 }[ecc];
  const numBlocks = NUM_ECC_BLOCKS[index][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[index][version];
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const blocks: number[][] = [];
  const rsDiv = reedSolomonComputeDivisor(blockEccLen);
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
    k += dat.length;
    const blockEcc = reedSolomonComputeRemainder(dat, rsDiv);
    if (i < numShortBlocks) dat.push(0); // padding placeholder for interleaving
    blocks.push(dat.concat(blockEcc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      // Skip the padding byte in short blocks.
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return result;
}

function buildMatrix(
  size: number,
  version: number,
  codewords: number[],
  mask: number,
  ecc: QrEccLevel
): boolean[][] {
  const modules: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

  const setFunctionModule = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  // Timing patterns.
  for (let i = 0; i < size; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Finder patterns and separators.
  const drawFinderPattern = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) {
          setFunctionModule(x, y, dist !== 2 && dist !== 4);
        }
      }
    }
  };
  drawFinderPattern(3, 3);
  drawFinderPattern(size - 4, 3);
  drawFinderPattern(3, size - 4);

  // Alignment patterns.
  const align = alignmentPatternPositions(version);
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === align.length - 1) ||
        (i === align.length - 1 && j === 0)
      )
        continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFunctionModule(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Reserve format information areas.
  {
    const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const fbits = ((data << 10) | rem) ^ 0x5412;

    // First copy.
    for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getBit(fbits, i));
    setFunctionModule(8, 7, getBit(fbits, 6));
    setFunctionModule(8, 8, getBit(fbits, 7));
    setFunctionModule(7, 8, getBit(fbits, 8));
    for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getBit(fbits, i));
    // Second copy.
    for (let i = 0; i < 8; i++) setFunctionModule(size - 1 - i, 8, getBit(fbits, i));
    for (let i = 8; i < 15; i++) setFunctionModule(8, size - 15 + i, getBit(fbits, i));
    setFunctionModule(8, size - 8, true); // always dark
  }

  // Version information (versions >= 7).
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const vbits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = getBit(vbits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, bit);
      setFunctionModule(b, a, bit);
    }
  }

  // Place codewords in the zig-zag path.
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && bitIndex < codewords.length * 8) {
          modules[y][x] = getBit(codewords[bitIndex >>> 3], 7 - (bitIndex & 7));
          bitIndex++;
        }
      }
    }
  }

  // Apply the mask.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!isFunction[y][x] && maskBit(mask, x, y)) modules[y][x] = !modules[y][x];
    }
  }
  return modules;
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function penaltyScore(modules: boolean[][]): number {
  const size = modules.length;
  const N1 = 3, N2 = 3, N3 = 40, N4 = 10;
  let result = 0;

  const countPatterns = (runHistory: number[]) => {
    const n = runHistory[1];
    const core =
      n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (
      (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
      (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
    );
  };

  const addHistory = (currentRunLength: number, runHistory: number[]) => {
    if (runHistory[0] === 0) {
      // Add imaginary edge padding if past edge.
      currentRunLength += size;
      runHistory.pop();
    }
    runHistory.unshift(currentRunLength);
  };

  const terminateAndCount = (
    currentRunColor: boolean,
    currentRunLength: number,
    runHistory: number[]
  ) => {
    if (currentRunColor) {
      addHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += size;
    addHistory(currentRunLength, runHistory);
    return countPatterns(runHistory);
  };

  // Runs of equal modules in rows.
  for (let y = 0; y < size; y++) {
    let runColor = false;
    let runLength = 0;
    const runHistory = [0, 0, 0, 0, 0, 0, 0];
    for (let x = 0; x < size; x++) {
      if (modules[y][x] === runColor) {
        runLength++;
        if (runLength === 5) result += N1;
        else if (runLength > 5) result++;
      } else {
        addHistory(runLength, runHistory);
        if (!runColor) result += countPatterns(runHistory) * N3;
        runColor = modules[y][x];
        runLength = 1;
      }
    }
    result += terminateAndCount(runColor, runLength, runHistory) * N3;
  }
  // Runs of equal modules in columns.
  for (let x = 0; x < size; x++) {
    let runColor = false;
    let runLength = 0;
    const runHistory = [0, 0, 0, 0, 0, 0, 0];
    for (let y = 0; y < size; y++) {
      if (modules[y][x] === runColor) {
        runLength++;
        if (runLength === 5) result += N1;
        else if (runLength > 5) result++;
      } else {
        addHistory(runLength, runHistory);
        if (!runColor) result += countPatterns(runHistory) * N3;
        runColor = modules[y][x];
        runLength = 1;
      }
    }
    result += terminateAndCount(runColor, runLength, runHistory) * N3;
  }
  // 2x2 blocks of same color.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const color = modules[y][x];
      if (color === modules[y][x + 1] && color === modules[y + 1][x] && color === modules[y + 1][x + 1]) {
        result += N2;
      }
    }
  }
  // Balance of dark modules.
  let dark = 0;
  for (const row of modules) for (const cell of row) if (cell) dark++;
  const total = size * size;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  result += k * N4;
  return result;
}
