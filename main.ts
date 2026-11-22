import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const POPS = new Uint8Array([0, 0, 0, 1, 1, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 0, 1, 1, 0, 0, 1, 2, 1, 1, 0, 1]);
const PUSH = new Uint8Array([0, 1, 1, 0, 2, 2, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]);

function run(p: Uint8Array, inp: Uint8Array): { out: Uint8Array; code: number } {
  const n = p.length;
  const op = new Int8Array(n);
  const im = new Int32Array(n);
  const ln = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const b = p[i];
    let c = -1, l = 0;
    switch (b) {
      case 0x00: c = 0; break;
      case 0x01: c = 1; l = 1; break;
      case 0x02: c = 2; l = 4; break;
      case 0x03: c = 3; break;
      case 0x04: c = 4; break;
      case 0x05: c = 5; break;
      case 0x06: c = 6; break;
      case 0x07: c = 7; break;
      case 0x10: c = 8; break;
      case 0x11: c = 9; break;
      case 0x12: c = 10; break;
      case 0x13: c = 11; break;
      case 0x14: c = 12; break;
      case 0x15: c = 13; break;
      case 0x16: c = 14; break;
      case 0x17: c = 15; break;
      case 0x18: c = 16; break;
      case 0x19: c = 17; break;
      case 0x1a: c = 18; break;
      case 0x1b: c = 19; break;
      case 0x1c: c = 20; break;
      case 0x1d: c = 21; break;
      case 0x1e: c = 22; break;
      case 0x20: c = 23; break;
      case 0x21: c = 24; break;
      case 0x22: c = 25; break;
      case 0x30: c = 26; l = 2; break;
      case 0x31: c = 27; l = 2; break;
      case 0x32: c = 28; l = 2; break;
      case 0x33: c = 29; l = 2; break;
      case 0x34: c = 30; break;
      case 0x40: c = 31; break;
      case 0x41: c = 32; break;
      case 0x50: c = 33; break;
      case 0x51: c = 34; break;
      case 0x52: c = 35; break;
      case 0x53: c = 36; break;
    }
    if (c < 0) { op[i] = -1; continue; }
    if (i + l >= n) { op[i] = -2; continue; }
    let v = 0;
    if (l === 1) v = (p[i + 1] << 24) >> 24;
    else if (l === 2) v = p[i + 1] | (p[i + 2] << 8);
    else if (l === 4) v = p[i + 1] | (p[i + 2] << 8) | (p[i + 3] << 16) | (p[i + 4] << 24);
    op[i] = c; im[i] = v; ln[i] = 1 + l;
  }
  const D = new Int32Array(256);
  let sp = 0;
  const C = new Int32Array(64);
  let cp = 0;
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let ol = 0, ip = 0, pc = 0, st = 0, code = 0;
  run: for (;;) {
    if (st === 1000000) { code = 10; break; }
    if (pc < 0 || pc >= n) { code = 9; break; }
    const c = op[pc];
    if (c < 0) { code = c === -1 ? 5 : 9; break; }
    st++;
    const ci = pc, imm = im[ci];
    pc = ci + ln[ci];
    if (sp < POPS[c]) { code = 2; break; }
    if (sp - POPS[c] + PUSH[c] > 256) { code = 3; break; }
    switch (c) {
      case 0: break run;
      case 1: case 2: D[sp++] = imm; break;
      case 3: sp--; break;
      case 4: D[sp] = D[sp - 1]; sp++; break;
      case 5: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 6: D[sp] = D[sp - 2]; sp++; break;
      case 7: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 8: case 9: case 10: case 11: case 12: case 13: case 14:
      case 16: case 17: case 18: case 20: case 21: case 22: case 23: case 24: case 25: {
        const b = D[sp - 1], a = D[sp - 2];
        let r: number;
        switch (c) {
          case 8: r = (a + b) | 0; break;
          case 9: r = (a - b) | 0; break;
          case 10: r = Math.imul(a, b); break;
          case 11: if (b === 0) { code = 4; break run; } r = a === -2147483648 && b === -1 ? a : (a / b) | 0; break;
          case 12: if (b === 0) { code = 4; break run; } r = b === -1 ? 0 : (a % b) | 0; break;
          case 13: if (b === 0) { code = 4; break run; } r = Math.floor((a >>> 0) / (b >>> 0)) | 0; break;
          case 14: if (b === 0) { code = 4; break run; } r = ((a >>> 0) % (b >>> 0)) | 0; break;
          case 16: r = a & b; break;
          case 17: r = a | b; break;
          case 18: r = a ^ b; break;
          case 20: r = a << (b & 31); break;
          case 21: r = a >> (b & 31); break;
          case 22: r = (a >>> (b & 31)) | 0; break;
          case 23: r = a === b ? 1 : 0; break;
          case 24: r = a < b ? 1 : 0; break;
          default: r = (a >>> 0) < (b >>> 0) ? 1 : 0; break;
        }
        sp -= 2; D[sp++] = r; break;
      }
      case 15: D[sp - 1] = (-D[sp - 1]) | 0; break;
      case 19: D[sp - 1] = ~D[sp - 1]; break;
      case 26: pc = pc + ((imm << 16) >> 16); break;
      case 27: if (D[--sp] === 0) pc = pc + ((imm << 16) >> 16); break;
      case 28: if (D[--sp] !== 0) pc = pc + ((imm << 16) >> 16); break;
      case 29: if (cp === 64) { code = 7; break run; } C[cp++] = pc; pc = imm; break;
      case 30: if (cp === 0) { code = 8; break run; } pc = C[--cp]; break;
      case 31: { const a = D[sp - 1]; if (a < 0 || a >= 256) { code = 6; break run; } D[sp - 1] = M[a]; break; }
      case 32: { const a = D[sp - 1], v = D[sp - 2]; if (a < 0 || a >= 256) { code = 6; break run; } sp -= 2; M[a] = v; break; }
      case 33: { const s = String(D[sp - 1]); if (ol + s.length > 65536) { code = 11; break run; } sp--; for (let i = 0; i < s.length; i++) out[ol++] = s.charCodeAt(i); break; }
      case 34: if (ol + 1 > 65536) { code = 11; break run; } out[ol++] = D[--sp] & 255; break;
      case 35: D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 36: code = D[--sp] & 255; break run;
    }
  }
  return { out: out.subarray(0, ol), code };
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}
