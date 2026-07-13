const FONTFACE_STYLE_ID = 'font-changer-fontface';
const OVERRIDE_STYLE_ID = 'font-changer-override';
const RTL_STYLE_ID = 'font-changer-rtl';


function getVazirCss() {
  const getUrl = (name) => chrome.runtime.getURL(`fonts/vazir/${name}.woff2`);
  return `
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Thin')}') format('woff2'); font-weight: 100; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Light')}') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir')}') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Medium')}') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Vazirmatn'; src: url('${getUrl('Vazir-Bold')}') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
  `;
}

function getEstedadCss() {
  const getUrl = (name) => chrome.runtime.getURL(`fonts/estedad/${name}.woff2`);
  return `
    @font-face { font-family: 'Estedad'; src: url('${getUrl('Estedad-Light')}') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Estedad'; src: url('${getUrl('Estedad-Regular')}') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Estedad'; src: url('${getUrl('Estedad-Medium')}') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Estedad'; src: url('${getUrl('Estedad-SemiBold')}') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Estedad'; src: url('${getUrl('Estedad-Bold')}') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Estedad'; src: url('${getUrl('Estedad-ExtraBold')}') format('woff2'); font-weight: 900; font-style: normal; font-display: swap; }
  `;
}
function getSahelCss() {
  const getUrl = (name) => chrome.runtime.getURL(`fonts/sahel/${name}.woff2`);
  return `
    @font-face { font-family: 'Sahel'; src: url('${getUrl('Sahel-Light')}') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Sahel'; src: url('${getUrl('Sahel')}') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Sahel'; src: url('${getUrl('Sahel-SemiBold')}') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Sahel'; src: url('${getUrl('Sahel-Bold')}') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Sahel'; src: url('${getUrl('Sahel-Black')}') format('woff2'); font-weight: 800; font-style: normal; font-display: swap; }
  `;
}

function getGandomCss() {
  const url = chrome.runtime.getURL('fonts/gandom/Gandom.woff');
  return `@font-face { font-family: 'Gandom'; src: url('${url}') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }`;
}

const FONT_CONFIG = {
  Vazirmatn: { get fontFaceCss() { return getVazirCss(); } },
  Estedad: { get fontFaceCss() { return getEstedadCss(); } },
  Sahel: { get fontFaceCss() { return getSahelCss(); } },
  Gandom: { get fontFaceCss() { return getGandomCss(); } }
};

const FONT_ELEMENTS = [
  'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'span', 'div', 'li', 'td', 'th',
  'input', 'textarea', 'button', 'select', 'label',
  'pre', 'option', 'dt', 'dd', 'figcaption', 'mark', 'small', 'strong'
];

const SITE_FONT_EXCLUDE = {
  'deepseek.com':        ['.katex *', '.katex', '.md-code-block *', 'code'],
  'chatgpt.com':         ['pre', 'code', 'code *', '.katex-display *', '.katex', '.katex *'],
  'aistudio.google.com': ['ms-code-block *', '.katex *', '.katex-display *', '[class*="symbol"]', '.inline-code', '.console-right-panel *', 'ms-differ *', 'ms-katex *', 'code *'],
  'claude.ai':           ['span[data-cds="Icon"]', '.katex *', '.katex', '.katex-display *', '.code-block__code *', 'div[data-skill-file-viewer] *', 'div[role="document"] *'],
  'qwen.ai':             ['.katex *', '.qwen-markdown-code *', 'qwen-markdown-codespan'],
  'gemini.google.com':   ['.katex *', '.katex-display *', '.math-inline *', 'code-block *', 'code'],
  'mistral.ai':          ['.katex *', '.katex', '.katex-display *', 'div.monaco-editor *', 'pre.shiki *','pre.shiki'],
  'grok.com':            ['.katex *', '.katex', '.katex-display *', 'code', 'code *', '.\\!font-mono'],
  'arena.ai':            ['.katex *', '.katex', '.katex-display *', 'code', 'code *', '.\\!font-mono', '.font-mono', 'div[data-panel]:not(:has(div[class*="[--chat-padding"])) *'],
  'z.ai':                ['.katex *', '.katex', 'code', 'code *','.cm-editor *'],
  'perplexity.ai':       ['.katex *', '.katex', '.katex-display *'],
  'notebooklm.google.com': ['.katex *', '.katex', '.katex-display *', 'code', 'code *'],
};

const DEFAULT_EXCLUDE = ['[class*="symbol"]', '[class*="icon"]', '[class*="status"]'];


async function getSiteFontSettings() {
  const hostname = window.location.hostname;
  const { siteSettings = {} } = await chrome.storage.local.get('siteSettings');

  // پیدا کردن domain متناظر در siteSettings
  const matchedDomain = Object.keys(siteSettings).find(domain =>{
    if(domain == 'google.com' || domain == 'www.google.com'){
      return true;
    }
    return hostname === domain || hostname.endsWith(domain);
  });

  if (matchedDomain !== undefined) {
    const isEnabled = siteSettings[matchedDomain] === true;
    const exclude = SITE_FONT_EXCLUDE[matchedDomain] || DEFAULT_EXCLUDE;
    return { enabled: isEnabled, exclude };
  }

  return {
    enabled: false,
    exclude: []
  };
}


async function buildOverrideCss(fontName) {
  const settings = await getSiteFontSettings();

  if (!settings.enabled) {
    return '';
  }

  const targetTags = `:is(${FONT_ELEMENTS.join(', ')})`;
  
  let finalSelector = targetTags;

  if (settings.exclude && settings.exclude.length > 0) {
    const excludes = settings.exclude.join(', ');
    finalSelector = `${targetTags}:not(:is(${excludes}))`;
  }

  return `${finalSelector} { font-family: '${fontName}', sans-serif !important; }`;
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
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    .ds-markdown-paragraph:has(> :first-child:is(.katex)) {
      text-align: center !important;
    }
    
    textarea.ds-scroll-area {
      direction: rtl !important;
      text-align: right !important;
    }
    .ds-markdown .ds-scroll-area { 
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
    .model-prompt-container{ 
      direction: rtl !important;
      text-align: right !important;
      margin-top: 12px;
    }
    .user-prompt-container{
      direction: rtl !important;
      text-align: right !important;
    }
    ms-code-block{
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
    .diff-header.right .title{
      text-align: right !important;
      direction: rtl !important;
    }
    ms-part-renderer{
      text-align: right !important;
      direction: rtl !important;
    }
  `;

  const ChatgptRtlCss = `
     #prompt-textarea p{
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
    div[role="textbox"] p{
      direction: rtl !important;
      text-align: right !important;
    }
    button.text-text-500[aria-expanded="true"]{
      direction: rtl !important;
      text-align: right !important;
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

  const GeminiRtlCss = `
    .table-content{
      mask-image: none !important;
      -webkit-mask-image = none !important;
    }
    .textarea{
      direction: rtl !important;
      text-align: right !important;
    }
    .query-text{
      direction: rtl !important;
      text-align: right !important;
    }
  `;

  const MistralRtlCss = `
    .katex-display{
      direction: ltr !important;
      text-align: center !important;
    }
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    table.min-w-full{
      direction: rtl !important;
      text-align: right !important;
    }
    div.monaco-editor{
      direction: ltr !important;
      text-align: left !important;
    }
    .peer\/table .pointer-events-none.absolute.inset-y-0.end-0 {
      background-image: none !important;
    }
    div:has(> div.prose){
      direction: rtl !important;
      text-align: right !important;
    }
    div.ProseMirror{
      direction: rtl !important;
      text-align: right !important;
    }
    pre.shiki{
      direction: ltr !important;
      text-align: left !important;
    }
    #message-input{
      direction: rtl !important;
      text-align: right !important;
    }
  `;

  const GrokRtlCss = `
    div.pointer-events-none.absolute{
      background-image: none !important;
    }
  `;

  const ArenaRtlCss = `
    div.body-base{
      direction: rtl !important;
      text-align: right !important;
    }
    div[data-code-block="true"], code *{
      direction: ltr !important;
      text-align: left !important;
    }
    textarea[name="message"]{
      direction: rtl !important;
      text-align: right !important;
    }
    .katex{
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    div[class*="[--chat-padding"] div.prose{
      direction: rtl !important;
      text-align: right !important;
    }

  `;

  const zAiRtlCss = `
    .user-message div.bg-\\[\\#EAEAEA\\]{
      direction: rtl !important;
      text-align: right !important;
    }
    table{
      direction: rtl !important;
    }
    .katex{
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    thead th div{
      text-align: center !important;
    }
    textarea[placeholder="Enter your creative description......"]{
      direction: rtl !important;
      text-align: right !important;
    }
  `;
  const PerplexityRtlCss = `
    .katex-display{
      direction: ltr !important;
      text-align: center !important;
    }
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    div:has(> pre.not-prose){
      direction: ltr !important;
      text-align: left !important;
    }
  `;
  const notebooklmRtlCss = `
    .katex-display{
      direction: ltr !important;
      text-align: center !important;
    }
    .katex:not(.katex-display .katex) {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: embed;
    }
    mat-card-content{
      direction: rtl !important;
      text-align: right !important;
    }
    pre:has(> code){
      direction: ltr !important;
      text-align: left !important;
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
  }else if (hostname.endsWith('gemini.google.com')) {
    getStyleElement(RTL_STYLE_ID).textContent = GeminiRtlCss;
    const elements = document.getElementsByClassName("table-content");
    for (const element of elements) {
      element.scrollTo({ left: element.scrollWidth, behavior: "smooth" });
    }
  }else if (hostname.endsWith('mistral.ai')) {
    getStyleElement(RTL_STYLE_ID).textContent = MistralRtlCss;
  }else if (hostname.endsWith('grok.com')) {
    getStyleElement(RTL_STYLE_ID).textContent = GrokRtlCss;
    const elements = document.getElementsByClassName("table-container");
    for (const element of elements) {
      element.scrollLeft = element.scrollWidth;
    }
  }else if (hostname.endsWith('arena.ai')) {
    getStyleElement(RTL_STYLE_ID).textContent = ArenaRtlCss;
  }else if (hostname.endsWith('z.ai')) {
    getStyleElement(RTL_STYLE_ID).textContent = zAiRtlCss;
    const elements = document.querySelectorAll("div:has(table)");
    for (const element of elements) {
      element.scrollLeft = element.scrollWidth;
    }
  }else if (hostname.endsWith('perplexity.ai')) {
    getStyleElement(RTL_STYLE_ID).textContent = PerplexityRtlCss;
  }else if (hostname.endsWith('notebooklm.google.com')) {
    getStyleElement(RTL_STYLE_ID).textContent = notebooklmRtlCss;
  }
}


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
        const custom = customFonts.find(f => f.id === activeFont);
        if (custom) {
          fontFaceCss = `@font-face { font-family: '${custom.name}'; src: url('${custom.dataUrl}') format('${custom.format}'); font-weight: normal; font-style: normal; font-display: swap; }`;
          cssFontFamilyName = custom.name;
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