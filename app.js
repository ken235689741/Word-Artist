const state = {
  image: null,
  template: "threads",
  asciiText: "請先上傳圖片。",
  cropDrag: {
    active: false,
    imageRect: null,
    cropRect: null,
  },
};

const refs = {
  imageInput: document.getElementById("imageInput"),
  columnsInput: document.getElementById("columnsInput"),
  rowsInput: document.getElementById("rowsInput"),
  styleInput: document.getElementById("styleInput"),
  styleCharsetInput: document.getElementById("styleCharsetInput"),
  charsetInput: document.getElementById("charsetInput"),
  contrastInput: document.getElementById("contrastInput"),
  mosaicInput: document.getElementById("mosaicInput"),
  edgeInput: document.getElementById("edgeInput"),
  zoomInput: document.getElementById("zoomInput"),
  offsetXInput: document.getElementById("offsetXInput"),
  offsetYInput: document.getElementById("offsetYInput"),
  renderBtn: document.getElementById("renderBtn"),
  copyBtn: document.getElementById("copyBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  downloadPngBtn: document.getElementById("downloadPngBtn"),
  asciiOutput: document.getElementById("asciiOutput"),
  socialOutput: document.getElementById("socialOutput"),
  socialCard: document.getElementById("socialCard"),
  socialTitle: document.getElementById("socialTitle"),
  tabs: [...document.querySelectorAll(".tab")],
  sourceCanvas: document.getElementById("sourceCanvas"),
  cropPreviewCanvas: document.getElementById("cropPreviewCanvas"),
};

const templateText = {
  threads: "Threads 留言樣式",
  fb: "Facebook 留言樣式",
  ig: "Instagram 留言樣式",
};

const templateTheme = {
  threads: { bg: "#14161b", fg: "#f2f5f7", meta: "#a5b1c2" },
  fb: { bg: "#132033", fg: "#f2f5f7", meta: "#9eb2cc" },
  ig: { bg: "#3f2d68", fg: "#f2f5f7", meta: "#f0d9ee" },
};

function setOutput(text) {
  state.asciiText = text;
  refs.asciiOutput.textContent = text;
  refs.socialOutput.textContent = text;
}

function getSettings() {
  return {
    columns: WordArtistEngine.clamp(Number(refs.columnsInput.value) || 80, 20, 220),
    rows: WordArtistEngine.clamp(Number(refs.rowsInput.value) || 60, 10, 160),
    style: refs.styleInput.value,
    useStyleCharset: refs.styleCharsetInput.checked,
    customCharset: refs.charsetInput.value || WordArtistEngine.STYLE_CHARSETS.realistic,
    contrast: Number(refs.contrastInput.value) || 1,
    mosaicBlock: Number(refs.mosaicInput.value) || 4,
    edgeThreshold: Number(refs.edgeInput.value) || 30,
    zoom: Number(refs.zoomInput.value) || 1,
    offsetX: Number(refs.offsetXInput.value) || 0,
    offsetY: Number(refs.offsetYInput.value) || 0,
  };
}

function computeCropBox(imgWidth, imgHeight, columns, rows, zoom, offsetX, offsetY) {
  const charAspect = 0.5;
  const targetAspect = columns / (rows * charAspect);
  const imageAspect = imgWidth / imgHeight;

  let cropWidth = imgWidth;
  let cropHeight = imgHeight;

  if (imageAspect > targetAspect) {
    cropWidth = imgHeight * targetAspect;
  } else {
    cropHeight = imgWidth / targetAspect;
  }

  cropWidth /= zoom;
  cropHeight /= zoom;

  const maxX = Math.max(0, imgWidth - cropWidth);
  const maxY = Math.max(0, imgHeight - cropHeight);

  const x = ((offsetX + 100) / 200) * maxX;
  const y = ((offsetY + 100) / 200) * maxY;

  return { x, y, cropWidth, cropHeight };
}

function drawCropPreview() {
  const canvas = refs.cropPreviewCanvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.image) {
    ctx.fillStyle = "#0c1015";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#a5b1c2";
    ctx.font = "14px sans-serif";
    ctx.fillText("上傳圖片後可拖曳裁切框", 16, canvas.height / 2);
    return;
  }

  const settings = getSettings();
  const img = state.image;
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (canvas.width - drawW) / 2;
  const dy = (canvas.height - drawH) / 2;

  ctx.drawImage(img, dx, dy, drawW, drawH);

  const crop = computeCropBox(
    img.width,
    img.height,
    settings.columns,
    settings.rows,
    settings.zoom,
    settings.offsetX,
    settings.offsetY
  );

  const cropPx = {
    x: dx + crop.x * scale,
    y: dy + crop.y * scale,
    w: crop.cropWidth * scale,
    h: crop.cropHeight * scale,
  };

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(dx, dy, drawW, drawH);
  ctx.clearRect(cropPx.x, cropPx.y, cropPx.w, cropPx.h);
  ctx.strokeStyle = "#4da2ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(cropPx.x, cropPx.y, cropPx.w, cropPx.h);

  state.cropDrag.imageRect = { x: dx, y: dy, w: drawW, h: drawH, scale };
  state.cropDrag.cropRect = cropPx;
}

function updateOffsetFromCanvasPoint(px, py) {
  const rect = state.cropDrag.imageRect;
  const cropRect = state.cropDrag.cropRect;
  if (!rect || !cropRect || !state.image) return;

  const centerX = WordArtistEngine.clamp(px, rect.x + cropRect.w / 2, rect.x + rect.w - cropRect.w / 2);
  const centerY = WordArtistEngine.clamp(py, rect.y + cropRect.h / 2, rect.y + rect.h - cropRect.h / 2);

  const maxX = rect.w - cropRect.w;
  const maxY = rect.h - cropRect.h;

  const cropX = maxX <= 0 ? 0 : centerX - cropRect.w / 2 - rect.x;
  const cropY = maxY <= 0 ? 0 : centerY - cropRect.h / 2 - rect.y;

  const offsetX = maxX <= 0 ? 0 : (cropX / maxX) * 200 - 100;
  const offsetY = maxY <= 0 ? 0 : (cropY / maxY) * 200 - 100;

  refs.offsetXInput.value = offsetX.toFixed(0);
  refs.offsetYInput.value = offsetY.toFixed(0);

  imageToAscii();
}

function imageToAscii() {
  if (!state.image) {
    setOutput("請先上傳圖片。");
    drawCropPreview();
    return;
  }

  const settings = getSettings();
  const srcCtx = refs.sourceCanvas.getContext("2d", { willReadFrequently: true });
  refs.sourceCanvas.width = settings.columns;
  refs.sourceCanvas.height = settings.rows;

  const crop = computeCropBox(
    state.image.width,
    state.image.height,
    settings.columns,
    settings.rows,
    settings.zoom,
    settings.offsetX,
    settings.offsetY
  );

  srcCtx.drawImage(
    state.image,
    crop.x,
    crop.y,
    crop.cropWidth,
    crop.cropHeight,
    0,
    0,
    settings.columns,
    settings.rows
  );

  const imageData = srcCtx.getImageData(0, 0, settings.columns, settings.rows);

  try {
    const ascii = WordArtistEngine.convertRgbaToAscii({
      data: imageData.data,
      ...settings,
    });
    setOutput(ascii);
  } catch (error) {
    setOutput(`生成失敗：${error.message}`);
  }

  drawCropPreview();
}

function exportSocialPng() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1080;

  const theme = templateTheme[state.template] || templateTheme.threads;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = theme.fg;
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(templateText[state.template], 60, 80);
  ctx.font = "24px sans-serif";
  ctx.fillStyle = theme.meta;
  ctx.fillText("@wordartist • exported", 60, 118);

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(44, 145, 992, 880);

  ctx.fillStyle = theme.fg;
  ctx.font = "18px ui-monospace, Menlo, Consolas, monospace";

  const lines = state.asciiText.split("\n");
  const lineHeight = 18;
  const maxLines = 48;
  const maxChars = 92;

  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line.slice(0, maxChars), 60, 180 + index * lineHeight);
  });

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `word-artist-${state.template}.png`;
  a.click();
}

function setTemplate(template) {
  state.template = template;
  refs.socialCard.className = `social-card ${template}`;
  refs.socialTitle.textContent = templateText[template];
  refs.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.template === template);
  });
}

refs.imageInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const image = new Image();
  image.onload = () => {
    state.image = image;
    imageToAscii();
  };
  image.src = URL.createObjectURL(file);
});

refs.renderBtn.addEventListener("click", imageToAscii);
refs.downloadPngBtn.addEventListener("click", exportSocialPng);

[
  refs.columnsInput,
  refs.rowsInput,
  refs.styleInput,
  refs.styleCharsetInput,
  refs.charsetInput,
  refs.contrastInput,
  refs.mosaicInput,
  refs.edgeInput,
  refs.zoomInput,
  refs.offsetXInput,
  refs.offsetYInput,
].forEach((input) => {
  input.addEventListener("change", imageToAscii);
});

refs.cropPreviewCanvas.addEventListener("mousedown", (event) => {
  if (!state.cropDrag.cropRect) return;
  const rect = refs.cropPreviewCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const c = state.cropDrag.cropRect;
  if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
    state.cropDrag.active = true;
    refs.cropPreviewCanvas.classList.add("dragging");
  }
});

window.addEventListener("mouseup", () => {
  state.cropDrag.active = false;
  refs.cropPreviewCanvas.classList.remove("dragging");
});

refs.cropPreviewCanvas.addEventListener("mousemove", (event) => {
  if (!state.cropDrag.active) return;
  const rect = refs.cropPreviewCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  updateOffsetFromCanvasPoint(x, y);
});

refs.copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(state.asciiText);
    refs.copyBtn.textContent = "已複製";
    setTimeout(() => {
      refs.copyBtn.textContent = "複製文字";
    }, 800);
  } catch {
    refs.copyBtn.textContent = "複製失敗";
  }
});

refs.downloadBtn.addEventListener("click", () => {
  const blob = new Blob([state.asciiText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "word-artist-output.txt";
  a.click();
  URL.revokeObjectURL(url);
});

refs.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setTemplate(tab.dataset.template));
});

setOutput(state.asciiText);
setTemplate("threads");
drawCropPreview();
