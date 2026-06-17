const FONTFACE_STYLE_ID = 'font-changer-fontface';
const OVERRIDE_STYLE_ID = 'font-changer-override';
const RTL_STYLE_ID = 'font-changer-rtl'; // شناسه جدید برای استایل RTL

function getVazirCss() {
  const regular = chrome.runtime.getURL('fonts/vazir/Vazir.woff2');
  const bold = chrome.runtime.getURL('fonts/vazir/Vazir-Bold.woff2');
  const light = chrome.runtime.getURL('fonts/vazir/Vazir-Light.woff2');
  const medium = chrome.runtime.getURL('fonts/vazir/Vazir-Medium.woff2');
  const thin = chrome.runtime.getURL('fonts/vazir/Vazir-Thin.woff2');

  return `
@font-face { font-family: 'Vazirmatn'; src: url('${regular}') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Vazirmatn'; src: url('${bold}') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Vazirmatn'; src: url('${light}') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: 'Vazirmatn'; src: url('${medium}') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: 'Vazirmatn'; src: url('${thin}') format('woff2'); font-weight: 100; font-style: normal; font-display: swap; }`;
}

function getShabnamCss() {
  const woff2 = chrome.runtime.getURL('fonts/shabnam/Shabnam.woff2');
  return `@font-face { font-family: 'Shabnam'; src: url('${woff2}') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }`;
}

function getGandomCss() {
    const woff = chrome.runtime.getURL('fonts/gandom/Gandom-FD.woff');
    return `@font-face { font-family: 'Gandom'; src: url('${woff}') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }`;
}

function getLalezarCss() {
    const ttf = chrome.runtime.getURL('fonts/lalezar/Digi-Lalezar-Plus-Circle.ttf');
    return `@font-face { font-family: 'Lalezar'; src: url('${ttf}') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }`;
}

function getKaraCss(){
    const regular = chrome.runtime.getURL('fonts/kara/Kara-Regular.ttf');
    const semiBold = chrome.runtime.getURL('fonts/kara/Kara-SemiBold.ttf');
    const light = chrome.runtime.getURL('fonts/kara/Kara-Light.ttf');

    return `@font-face { font-family: 'Kara'; src: url('${regular}') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
            @font-face { font-family: 'Kara'; src: url('${semiBold}') format('truetype'); font-weight: 600; font-style: normal; font-display: swap; }
            @font-face { font-family: 'Kara'; src: url('${light}') format('truetype'); font-weight: 300; font-style: normal; font-display: swap; }`;
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
  'pre', 'option', 'dt', 'dd',
  'figcaption', 'mark', 'small', 'strong'
];

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

// تابع جدید برای اعمال و حذف حالت راست‌چین
function applyRTL(isActive) {
  if (isActive) {
    const rtlCss = `
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
      textarea[formcontrolname="promptText"]{
        text-align: right !important;
        direction: rtl !important;
      }
      .katex-display{
        text-align: left !important;
        direction: ltr !important;
      }

      /* ─── DeepSeek ──── */
      ds-message div:not(.ds-markdown) {
        direction: rtl !important;
        text-align: right !important;
      }
      .ds-message .ds-markdown{
        direction: ltr !important;
        text-align: left !important;
      }
      .md-code-block{
        text-align: left !important;
        direction: ltr !important;
      }
      .ds-markdown-paragraph:has(.katex) {
        text-align: left !important;
        direction: ltr !important;
      }
      textarea.ds-scroll-area[placeholder="Message DeepSeek"][name="search"]{
        direction: rtl !important;
        text-align: right !important;
      }

      /* ─── Chatgpt ──── */
      .text-base{
        direction: rtl !important;
        text-align: right !important;
      }
      .katex-display{
        text-align: left !important;
        direction: ltr !important;
      }
      #prompt-textarea p{
        direction: rtl !important;
        text-align: right !important;
      }
    `;
    getStyleElement(RTL_STYLE_ID).textContent = rtlCss;
  } else {
    removeStyleElement(RTL_STYLE_ID);
  }
}

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
      } else if (message.action === 'applyRTL') { // هندل کردن اکشن راست‌چین
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
    const { activeFont, isRTL } = await chrome.storage.local.get(['activeFont', 'isRTL']);
    if (activeFont && FONT_CONFIG[activeFont]) {
      applyFont(
        FONT_CONFIG[activeFont].fontFaceCss,
        buildOverrideCss(activeFont)
      );
    }
    if (isRTL) {
      applyRTL(true);
    }
  } catch (err) {
    console.warn('Font Changer init error:', err.message);
  }
}

init();