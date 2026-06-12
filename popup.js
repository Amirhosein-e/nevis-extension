function getVazirCss() {
  const regular = chrome.runtime.getURL('fonts/vazir/Vazir.woff2');
  const bold = chrome.runtime.getURL('fonts/vazir/Vazir-Bold.woff2');
  const light = chrome.runtime.getURL('fonts/vazir/Vazir-Light.woff2');
  const medium = chrome.runtime.getURL('fonts/vazir/Vazir-Medium.woff2');
  const thin = chrome.runtime.getURL('fonts/vazir/Vazir-Thin.woff2');

  return `
@font-face {
  font-family: 'Vazirmatn';
  src: url('${regular}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Vazirmatn';
  src: url('${bold}') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Vazirmatn';
  src: url('${light}') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Vazirmatn';
  src: url('${medium}') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Vazirmatn';
  src: url('${thin}') format('woff2');
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}`;
}

function getShabnamCss() {
  const woff2 = chrome.runtime.getURL('fonts/shabnam/Shabnam.woff2');

  return `
@font-face {
  font-family: 'Shabnam';
  src: url('${woff2}') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
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

const POPUP_FONTS = {
  Vazirmatn: {
    get fontFaceCss() { return getVazirCss(); }
  },
  Shabnam: {
    get fontFaceCss() { return getShabnamCss(); }
  },
  Lalezar: {
    get fontFaceCss() { return getLalezarCss(); }
  },
  Kara: {
    get fontFaceCss() { return getKaraCss(); }
  },
  Gandom: {
    get fontFaceCss() { return getGandomCss(); }
  }
};

const POPUP_FONT_ELEMENTS = [
  'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'span', 'div', 'li', 'td', 'th',
  'input', 'textarea', 'button', 'select', 'label',
  'pre', 'option', 'dt', 'dd',
  'figcaption', 'mark', 'small', 'strong'
];

function buildOverrideCss(fontName) {
  const selectors = POPUP_FONT_ELEMENTS.map(tag => {
    return `${tag}:not([class*="symbol"])`;
  });

  return `${selectors.join(',\n')} {
  font-family: '${fontName}', sans-serif !important;
}`;
}

function isInjectableUrl(url) {
  if (!url) return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://')
  );
}

async function sendMessageToTab(tab, message) {
  if (!tab || !tab.id || !isInjectableUrl(tab.url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    if (err.message?.includes('Receiving end does not exist')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (injectErr) {
        console.warn('نمی‌توان content script را inject کرد:', injectErr.message);
      }
    }
  }
}

let currentFont = null;

function updateToggles(activeFont) {
  document.querySelectorAll('.toggle-input').forEach(input => {
    input.checked = input.dataset.font === activeFont;
  });
}

async function handleToggle(input) {
  const fontName = input.dataset.font;
  const isChecked = input.checked;

  if (isChecked) {
    currentFont = fontName;
    await chrome.storage.local.set({ activeFont: fontName });
  } else {
    currentFont = null;
    await chrome.storage.local.remove('activeFont');
  }

  updateToggles(currentFont);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (currentFont) {
    await sendMessageToTab(tab, {
      action: 'applyFont',
      fontName: currentFont,
      fontFaceCss: POPUP_FONTS[currentFont].fontFaceCss,
      overrideCss: buildOverrideCss(currentFont)
    });
  } else {
    await sendMessageToTab(tab, { action: 'removeFont' });
  }
}

async function handleReset() {
  currentFont = null;
  await chrome.storage.local.remove('activeFont');
  updateToggles(null);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    await sendMessageToTab(tab, { action: 'removeFont' });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const { activeFont } = await chrome.storage.local.get('activeFont');
  currentFont = activeFont || null;
  updateToggles(currentFont);

  document.querySelectorAll('.toggle-input').forEach(input => {
    input.addEventListener('change', () => handleToggle(input));
  });

  document.getElementById('reset-btn').addEventListener('click', handleReset);
});