const state = {
  image: null,
  template: "threads",
  asciiText: "請先上傳圖片。",
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
  asciiOutput: document.getElementById("asciiOutput"),
  socialOutput: document.getElementById("socialOutput"),
  socialCard: document.getElementById("socialCard"),
  socialTitle: document.getElementById("socialTitle"),
  tabs: [...document.querySelectorAll(".tab")],
  sourceCanvas: document.getElementById("sourceCanvas"),
};

const templateText = {
  threads: "Threads 留言樣式",
  fb: "Facebook 留言樣式",
  ig: "Instagram 留言樣式",
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

function imageToAscii() {
  if (!state.image) {
    setOutput("請先上傳圖片。");
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
  if (!file) {
    return;
  }

  const image = new Image();
  image.onload = () => {
    state.image = image;
    imageToAscii();
  };
  image.src = URL.createObjectURL(file);
});

refs.renderBtn.addEventListener("click", imageToAscii);

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
