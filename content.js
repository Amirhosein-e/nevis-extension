const FONTFACE_STYLE_ID = 'font-changer-fontface';
const OVERRIDE_STYLE_ID = 'font-changer-override';
const RTL_STYLE_ID = 'font-changer-rtl';

// ─── توابع تولید CSS فونت‌های داخلی ───────────────────────────────────────

function getVazirCss() {
  const getUrl = (name) => chrome.runtime.getURL(`fonts/vazir/${name}.woff2`);
  return `
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir')}') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Bold')}') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Light')}') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Medium')}') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Thin')}') format('woff2'); font-weight: 100; font-style: normal; font-display: swap; }
  `;
}

function getShabnamCss() {
  const url = chrome.runtime.getURL('fonts/shabnam/Shabnam.woff2');
  return `@font-face { font-family: 'Shabnam'; src: url('${url}') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }`;
}

function getGandomCss() {
  const url = chrome.runtime.getURL('fonts/gandom/Gandom-FD.woff');
  return `@font-face { font-family: 'Gandom'; src: url('${url}') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }`;
}

function getLalezarCss() {
  const bold = chrome.runtime.getURL('fonts/lalezar/Digi-Lalezar-Plus-Circle.ttf');
  const regular = chrome.runtime.getURL('fonts/lalezar/DigiLalezarPlus.ttf');
  return `
    @font-face { font-family: 'Lalezar'; src: url('${regular}') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Lalezar'; src: url('${bold}') format('truetype'); font-weight: 600; font-style: normal; font-display: swap; }
  `;
}

function getKaraCss() {
  const getUrl = (name) => chrome.runtime.getURL(`fonts/kara/${name}.ttf`);
  return `
    @font-face { font-family: 'Kara'; src: url('${getUrl('Kara-Regular')}') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Kara'; src: url('${getUrl('Kara-SemiBold')}') format('truetype'); font-weight: 600; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Kara'; src: url('${getUrl('Kara-Light')}') format('truetype'); font-weight: 300; font-style: normal; font-display: swap; }
  `;
}

const FONT_CONFIG = {
  Vazirmatn: { get fontFaceCss() { return getVazirCss(); } },
  Shabnam: { get fontFaceCss() { return getShabnamCss(); } },
  Lalezar: { get fontFaceCss() { return getLalezarCss(); } },
  Kara: { get fontFaceCss() { return getKaraCss(); } },
  Gandom: { get fontFaceCss() { return getGandomCss(); } }
};

const FONT_ELEMENTS = [
  'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'span', 'div', 'li', 'td', 'th',
  'input', 'textarea', 'button', 'select', 'label',
  'pre', 'option', 'dt', 'dd', 'figcaption', 'mark', 'small', 'strong'
];

// ─── توابع کمکی DOM و اعمال استایل ──────────────────────────────────────────

function buildOverrideCss(fontName) {
  const selectors = FONT_ELEMENTS.map(tag => `${tag}:not([class*="symbol"])`);
  return `${selectors.join(',\n')} { font-family: '${fontName}', sans-serif !important; }`;
}

function getStyleElement(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    (document.head || document.documentElement).appendChild(el);
  }
  return el;
}

function removeStyleElement(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function applyFont(fontFaceCss, overrideCss) {
  if (!fontFaceCss || !overrideCss) return;
  getStyleElement(FONTFACE_STYLE_ID).textContent = fontFaceCss;
  getStyleElement(OVERRIDE_STYLE_ID).textContent = overrideCss;
}

function removeFont() {
  removeStyleElement(FONTFACE_STYLE_ID);
  removeStyleElement(OVERRIDE_STYLE_ID);
}

function applyRTL(isActive) {
  if (!isActive) {
    removeStyleElement(RTL_STYLE_ID);
    return;
  }

  const DeepseekRtlCss = `
    .ds-markdown, .ds-assistant-message-main-content {
      direction: rtl !important;
      text-align: right !important;
    }
    .ds-message > div:first-child {
      direction: rtl !important;
      text-align: right !important;
    }
    .md-code-block, .ds-code-block, pre {
      direction: ltr !important;
      text-align: left !important;
    }
    .katex {
      text-align: center !important;
      direction: ltr !important;
      unicode-bidi: embed; 
    }
    textarea.ds-scroll-area[placeholder="Message DeepSeek"][name="search"] {
      direction: rtl !important;
      text-align: right !important;
    }
  `;
  
  const AiStudioRtlCss = `
    ms-chat-turn { 
      direction: rtl !important;
      text-align: right !important;
    }
    ms-chat-turn ms-code-block, ms-code-block {
      direction: ltr !important;
      text-align: left !important;
    }
    textarea {
      direction: ltr !important;
      text-align: left !important;
    }
    textarea[formcontrolname="promptText"] {
      text-align: right !important;
      direction: rtl !important;
    }
    .katex-display {
      text-align: left !important;
      direction: ltr !important;
    }
  `;
  
  const ChatgptRtlCss = `
    .text-base { 
      direction: rtl !important;
      text-align: right !important;
    }
    #prompt-textarea p {
      direction: rtl !important;
      text-align: right !important; 
    }
  `;

  const hostname = window.location.hostname;

  if (hostname.endsWith('deepseek.com')) {
    getStyleElement(RTL_STYLE_ID).textContent = DeepseekRtlCss;
  }
  else if (hostname.endsWith('chatgpt.com')) {
    getStyleElement(RTL_STYLE_ID).textContent = ChatgptRtlCss;
  }
  else if (hostname === 'aistudio.google.com') {
    getStyleElement(RTL_STYLE_ID).textContent = AiStudioRtlCss;
  }
  // else if (hostname.endsWith('claude.ai')) {
  //   getStyleElement(RTL_STYLE_ID).textContent = ClaudeRtlCss;
  // }
  // else if (hostname.endsWith('perplexity.ai')) {
  //   getStyleElement(RTL_STYLE_ID).textContent = PerplexityRtlCss;
  // }
  // else if (hostname === 'gemini.google.com') {
  //   getStyleElement(RTL_STYLE_ID).textContent = GeminiRtlCss;
  // }
}
// ─── شنونده پیام‌ها و مقداردهی اولیه ──────────────────────────────────────────

if (!window.__fontChangerListenerRegistered) {
  window.__fontChangerListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === 'applyFont') {
        applyFont(message.fontFaceCss, message.overrideCss);
        sendResponse({ success: true });
      } else if (message.action === 'removeFont') {
        removeFont();
        sendResponse({ success: true });
      } else if (message.action === 'applyRTL') {
        applyRTL(message.isActive);
        sendResponse({ success: true });
      }
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  });
}

async function init() {
  try {
    const { activeFont, isRTL, customFonts = [] } = await chrome.storage.local.get(['activeFont', 'isRTL', 'customFonts']);
    
    if (activeFont) {
      let fontFaceCss = "";
      
      if (FONT_CONFIG[activeFont]) {
        fontFaceCss = FONT_CONFIG[activeFont].fontFaceCss;
      } else {
        const custom = customFonts.find(f => f.name === activeFont);
        if (custom) {
          fontFaceCss = `@font-face { font-family: '${custom.name}'; src: url('${custom.dataUrl}') format('${custom.format}'); font-weight: normal; font-style: normal; font-display: swap; }`;
        }
      }

      if (fontFaceCss) {
        applyFont(fontFaceCss, buildOverrideCss(activeFont));
      }
    }
    if (isRTL) {
      applyRTL(true);
    }
  } catch (err) {
    console.warn('Font Changer init error:', err.message);
  }
}

init();