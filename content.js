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

const SITE_FONT_EXCLUDE = {
  'deepseek.com':        ['.katex *', '.katex-display *'],
  'chatgpt.com':         ['pre', 'code', '.code-block__code', '[class*="symbol"]'],
  'aistudio.google.com': ['ms-code-block *', '.katex *', '.katex-display *', '[class*="symbol"]', '.inline-code', '.console-right-panel *', 'ms-differ *'],
  'claude.ai':           ['span[data-cds="Icon"]', '.katex *', '.katex-display *', '.code-block__code *', 'div[data-skill-file-viewer] *'],
  'qwen.ai':             ['.katex *', '.qwen-markdown-code *', 'qwen-markdown-codespan'],
};

const DEFAULT_EXCLUDE = ['[class*="symbol"]', '.katex'];


async function getSiteFontSettings() {
  const hostname = window.location.hostname;
  const { siteSettings = {} } = await chrome.storage.local.get('siteSettings');

  // پیدا کردن domain متناظر در siteSettings
  const matchedDomain = Object.keys(siteSettings).find(domain =>
    hostname.endsWith(domain) || hostname === domain
  );

  if (matchedDomain !== undefined) {
    const isEnabled = siteSettings[matchedDomain] === true;
    const exclude = SITE_FONT_EXCLUDE[matchedDomain] || DEFAULT_EXCLUDE;
    return { enabled: isEnabled, exclude };
  }

  // اگر در لیست setting نیست = فونت اعمال می‌شه با exclude پیش‌فرض
  return {
    enabled: true,
    exclude: SITE_FONT_EXCLUDE[hostname] || DEFAULT_EXCLUDE
  };
}

// ─── ساخت CSS اعمال فونت ─────────────────────────────────────────────────────

async function buildOverrideCss(fontName) {
  const settings = await getSiteFontSettings();

  if (!settings.enabled) {
    return '';
  }

  const exclusionString = settings.exclude && settings.exclude.length > 0
    ? settings.exclude.map(selector => `:not(${selector})`).join('')
    : '';

  const selectors = FONT_ELEMENTS.map(tag => `${tag}${exclusionString}`);
  return `${selectors.join(',\n')} { font-family: '${fontName}', sans-serif !important; }`;
}

// ─── توابع کمکی DOM و اعمال استایل ──────────────────────────────────────────

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
  if (!fontFaceCss) return;
  getStyleElement(FONTFACE_STYLE_ID).textContent = fontFaceCss;

  if (overrideCss) {
    getStyleElement(OVERRIDE_STYLE_ID).textContent = overrideCss;
  } else {
    removeStyleElement(OVERRIDE_STYLE_ID);
  }
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
    .katex-display{
      direction: ltr !important;
      text-align: center !important;
    }
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    textarea.ds-scroll-area[placeholder="Message DeepSeek"][name="search"] {
      direction: rtl !important;
      text-align: right !important;
    }
    .ds-markdown .ds-scroll-area {
      direction: ltr !important; 
      transform: translateX(80px);
    }
    .ds-markdown .ds-scroll-area table {
      direction: rtl !important;
      width: max-content !important;
    }
    .ds-markdown th, .ds-markdown td {
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
    textarea[formcontrolname="promptText"] {
      text-align: right !important;
      direction: rtl !important;
    }
    textarea.cdk-textarea-autosize {
      text-align: right !important;
      direction: rtl !important;
    }
    div.autocomplete-mirror{
      text-align: right !important;
      direction: rtl !important;
    }
    ms-console-turn > div{
      text-align: right !important;
      direction: rtl !important;
    }
    .katex-display{
      direction: ltr !important;
      text-align: center !important;
    }
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    .inline-code{
      direction: ltr !important;
    }
  `;

  const ChatgptRtlCss = `
      direction: rtl !important;
      text-align: right !important; 
    }
  `;

  const ClaudeRtlCss = `
    div[data-user-message-bubble="true"]{
      direction: rtl !important;
      text-align: right !important;
    }
    .standard-markdown{
      direction: rtl !important;
      text-align: right !important;
    }
    .katex-display{
      direction: ltr !important;
      text-align: center !important;
    }
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    .code-block__code{
      direction: ltr !important;
      text-align: left !important;
    }
    div[aria-label*="code"] {
      direction: ltr !important;
      text-align: left !important;
    }
  `;

  const QwenRtlCss = `
    .response-message-content{
      direction: rtl !important;
      text-align: right !important;
    }
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    .qwen-markdown-code, .qwen-markdown-codespan{
      direction: ltr !important;
      text-align: left !important;
    }
    .qwen-markdown-table-thead-tr-th{
      direction: rtl !important;
      text-align: center !important;
    }
    .qwen-markdown-table-thead-tr-th,
    .qwen-markdown-table-tbody-tr-td {
      border-right: none !important; 
      border-left: 1px solid #e1e3ea !important; 
    }
    .qwen-markdown-table-thead-tr-th:last-child,
    .qwen-markdown-table-tbody-tr-td:last-child {
      border-left: none !important;
    }
  `;

  const hostname = window.location.hostname;

  if (hostname.endsWith('deepseek.com')) {
    getStyleElement(RTL_STYLE_ID).textContent = DeepseekRtlCss;
    const elements = document.getElementsByClassName("ds-scroll-area");
    for (const element of elements) {
      element.scrollTo({ left: element.scrollWidth, behavior: "smooth" });
    }
  }
  else if (hostname.endsWith('chatgpt.com')) {
    getStyleElement(RTL_STYLE_ID).textContent = ChatgptRtlCss;
  }
  else if (hostname === 'aistudio.google.com') {
    getStyleElement(RTL_STYLE_ID).textContent = AiStudioRtlCss;
  }
  else if (hostname.endsWith('claude.ai')) {
    getStyleElement(RTL_STYLE_ID).textContent = ClaudeRtlCss;
  }
  else if (hostname.endsWith('qwen.ai')) {
    getStyleElement(RTL_STYLE_ID).textContent = QwenRtlCss;
  }
}

// ─── شنونده پیام‌ها و مقداردهی اولیه ────────────────────────────────────────

if (!window.__fontChangerListenerRegistered) {
  window.__fontChangerListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        if (message.action === 'applyFont') {
          const fontName = message.fontName || 'Vazirmatn';
          const overrideCss = await buildOverrideCss(fontName);
          applyFont(message.fontFaceCss, overrideCss);
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
    })();
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
        const overrideCss = await buildOverrideCss(activeFont);
        applyFont(fontFaceCss, overrideCss);
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