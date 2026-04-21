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
  charsetInput: document.getElementById("charsetInput"),
  contrastInput: document.getElementById("contrastInput"),
  mosaicInput: document.getElementById("mosaicInput"),
  edgeInput: document.getElementById("edgeInput"),
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
    charset: refs.charsetInput.value || "@%#*+=-:. ",
    contrast: Number(refs.contrastInput.value) || 1,
    mosaicBlock: Number(refs.mosaicInput.value) || 4,
    edgeThreshold: Number(refs.edgeInput.value) || 30,
  };
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
  srcCtx.drawImage(state.image, 0, 0, settings.columns, settings.rows);

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
  refs.charsetInput,
  refs.contrastInput,
  refs.mosaicInput,
  refs.edgeInput,
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
