(function initEngine(globalScope) {
  const STYLE_CHARSETS = {
    realistic: "@%#*+=-:. ",
    mosaic: "█▓▒░■□▪▫· ",
    line: "█┃━╱╲┼┄· ",
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyContrast(gray, contrast) {
    return clamp((gray - 128) * contrast + 128, 0, 255);
  }

  function rgbaToGray(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function getCharsetForStyle(style, customCharset, useStyleCharset) {
    if (useStyleCharset) {
      return STYLE_CHARSETS[style] || STYLE_CHARSETS.realistic;
    }
    return customCharset || STYLE_CHARSETS.realistic;
  }

  function buildGrayMapFromRGBA(data, columns, rows, contrast) {
    const grayMap = new Float32Array(columns * rows);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const index = (y * columns + x) * 4;
        const gray = rgbaToGray(data[index], data[index + 1], data[index + 2]);
        grayMap[y * columns + x] = applyContrast(gray, contrast);
      }
    }
    return grayMap;
  }

  function applyMosaic(grayMap, columns, rows, blockSize) {
    const result = new Float32Array(grayMap);
    for (let by = 0; by < rows; by += blockSize) {
      for (let bx = 0; bx < columns; bx += blockSize) {
        let total = 0;
        let count = 0;
        for (let y = by; y < Math.min(by + blockSize, rows); y += 1) {
          for (let x = bx; x < Math.min(bx + blockSize, columns); x += 1) {
            total += result[y * columns + x];
            count += 1;
          }
        }
        const avg = total / count;
        for (let y = by; y < Math.min(by + blockSize, rows); y += 1) {
          for (let x = bx; x < Math.min(bx + blockSize, columns); x += 1) {
            result[y * columns + x] = avg;
          }
        }
      }
    }
    return result;
  }

  function lineCharByDirection(dx, dy) {
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx > ady * 1.5) {
      return "━";
    }
    if (ady > adx * 1.5) {
      return "┃";
    }
    return dx * dy > 0 ? "╲" : "╱";
  }

  function shadeChar(gray) {
    if (gray < 90) return "▓";
    if (gray < 150) return "▒";
    if (gray < 210) return "░";
    return " ";
  }

  function toAscii(grayMap, columns, rows, style, charset, edgeThreshold) {
    const lines = [];
    for (let y = 0; y < rows; y += 1) {
      let line = "";
      for (let x = 0; x < columns; x += 1) {
        const i = y * columns + x;
        const center = grayMap[i];

        if (style === "line") {
          const left = grayMap[y * columns + clamp(x - 1, 0, columns - 1)];
          const right = grayMap[y * columns + clamp(x + 1, 0, columns - 1)];
          const up = grayMap[clamp(y - 1, 0, rows - 1) * columns + x];
          const down = grayMap[clamp(y + 1, 0, rows - 1) * columns + x];
          const dx = right - left;
          const dy = down - up;
          const gradient = Math.abs(dx) + Math.abs(dy);

          if (gradient > edgeThreshold) {
            line += lineCharByDirection(dx, dy);
          } else {
            line += shadeChar(center);
          }
          continue;
        }

        const normalized = 1 - center / 255;
        const idx = clamp(Math.floor(normalized * (charset.length - 1)), 0, charset.length - 1);
        line += charset[idx];
      }
      lines.push(line);
    }
    return lines.join("\n");
  }

  function convertRgbaToAscii(params) {
    const {
      data,
      columns,
      rows,
      style = "realistic",
      customCharset = STYLE_CHARSETS.realistic,
      useStyleCharset = true,
      contrast = 1,
      mosaicBlock = 4,
      edgeThreshold = 30,
    } = params;

    const charset = getCharsetForStyle(style, customCharset, useStyleCharset);

    if (!charset || charset.length < 2) {
      throw new Error("charset must include at least 2 characters");
    }

    const grayMap = buildGrayMapFromRGBA(data, columns, rows, contrast);
    const styledMap = style === "mosaic" ? applyMosaic(grayMap, columns, rows, mosaicBlock) : grayMap;

    return toAscii(styledMap, columns, rows, style, charset, edgeThreshold);
  }

  const api = {
    STYLE_CHARSETS,
    clamp,
    applyContrast,
    rgbaToGray,
    getCharsetForStyle,
    buildGrayMapFromRGBA,
    applyMosaic,
    toAscii,
    convertRgbaToAscii,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.WordArtistEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
