const test = require('node:test');
const assert = require('node:assert/strict');
const {
  convertRgbaToAscii,
  applyMosaic,
  getCharsetForStyle,
  STYLE_CHARSETS,
} = require('../engine.js');

function grayPixel(v) {
  return [v, v, v, 255];
}

test('realistic mode outputs expected dimensions', () => {
  const pixels = new Uint8ClampedArray([
    ...grayPixel(0),
    ...grayPixel(255),
    ...grayPixel(64),
    ...grayPixel(192),
  ]);

  const output = convertRgbaToAscii({
    data: pixels,
    columns: 2,
    rows: 2,
    style: 'realistic',
    customCharset: '#.',
    useStyleCharset: false,
    contrast: 1,
  });

  const lines = output.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0].length, 2);
  assert.equal(lines[1].length, 2);
});

test('mosaic mode smooths values within block', () => {
  const source = new Float32Array([
    0, 255,
    255, 0,
  ]);

  const result = applyMosaic(source, 2, 2, 2);
  assert.equal(result[0], result[1]);
  assert.equal(result[1], result[2]);
  assert.equal(result[2], result[3]);
});

test('line mode highlights edges and uses directional chars', () => {
  const pixels = new Uint8ClampedArray([
    ...grayPixel(0),
    ...grayPixel(255),
    ...grayPixel(0),
    ...grayPixel(255),
  ]);

  const output = convertRgbaToAscii({
    data: pixels,
    columns: 2,
    rows: 2,
    style: 'line',
    edgeThreshold: 20,
  });

  assert.match(output, /[┃━╱╲]/);
});

test('style charset can be auto selected', () => {
  assert.equal(getCharsetForStyle('mosaic', '@#', true), STYLE_CHARSETS.mosaic);
  assert.equal(getCharsetForStyle('realistic', '@#', false), '@#');
});

test('rejects invalid charset', () => {
  const pixels = new Uint8ClampedArray([...grayPixel(120)]);
  assert.throws(
    () =>
      convertRgbaToAscii({
        data: pixels,
        columns: 1,
        rows: 1,
        customCharset: '*',
        useStyleCharset: false,
      }),
    /at least 2/
  );
});
