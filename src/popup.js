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

const BUILTIN_FONTS = {
  Vazirmatn: { get fontFaceCss() { return getVazirCss(); } },
  Estedad: { get fontFaceCss() { return getEstedadCss(); } },
  Sahel: { get fontFaceCss() { return getSahelCss(); } },
  Gandom: { get fontFaceCss() { return getGandomCss(); } }
};

let POPUP_FONTS = { ...BUILTIN_FONTS };
let currentFontValue = '';
let selectedFile = null;

const FONT_ELEMENTS = [
  'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'span', 'div', 'li', 'td', 'th',
  'input', 'textarea', 'button', 'select', 'label',
  'pre', 'option', 'dt', 'dd', 'figcaption', 'mark', 'small', 'strong',
];

// ─── توابع کاربردی و مدیریت استایل ──────────────────────────────────────────

function buildOverrideCss(fontName) {
  const selectors = FONT_ELEMENTS.map(tag => `${tag}:not([class*="symbol"])`);
  return `${selectors.join(',\n')} { font-family: '${fontName}', sans-serif !important; }`;
}

function buildCustomFontFaceCss(fontName, dataUrl, format) {
  return `@font-face {
    font-family: '${fontName}';
    src: url('${dataUrl}') format('${format}');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }`;
}

function getFormatFromExt(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
  return map[ext] || 'truetype';
}

function isInjectableUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'));
}

async function sendMessageToTab(tab, message) {
  if (!tab || !tab.id || !isInjectableUrl(tab.url)) return;
  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    if (err.message?.includes('Receiving end does not exist')) {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        await new Promise(resolve => setTimeout(resolve, 100));
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (e) {
        console.warn('inject failed:', e.message);
      }
    }
  }
}

// ─── مدیریت ذخیره‌سازی محلی (Storage) ───────────────────────────────────────

async function loadCustomFonts() {
  const { customFonts = [] } = await chrome.storage.local.get('customFonts');
  return customFonts;
}

async function saveCustomFonts(list) {
  await chrome.storage.local.set({ customFonts: list });
}

function registerCustomFonts(customFonts) {
  customFonts.forEach(({ id, name, dataUrl, format }) => {
    POPUP_FONTS[id] = {
      name,
      fontFaceCss: buildCustomFontFaceCss(name, dataUrl, format),
    };
  });
}

// ─── مدیریت رابط کاربری (UI) ────────────────────────────────────────────────

function closeAccordion() {
  document.getElementById('accordion-trigger').classList.remove('open');
  document.getElementById('accordion-panel').classList.remove('open');
}

function toggleAccordion() {
  document.getElementById('accordion-trigger').classList.toggle('open');
  document.getElementById('accordion-panel').classList.toggle('open');
}

function setSelectedFont(value, label) {
  currentFontValue = value;
  document.getElementById('selected-font-label').textContent = label;
  document.querySelectorAll('.font-item').forEach(el => el.classList.remove('active'));

  const active = document.querySelector(`.font-item[data-value="${CSS.escape(value)}"]`);
  if (active) active.classList.add('active');
}

function createCustomFontItem(id, name) {
  const li = document.createElement('li');
  li.className = 'font-item font-item--custom';
  li.dataset.value = id;

  const labelSpan = document.createElement('span');
  labelSpan.className = 'font-item-label';
  labelSpan.textContent = name;

  const delBtn = document.createElement('button');
  delBtn.className = 'font-item-delete';
  delBtn.title = 'حذف فونت';
  delBtn.dataset.deleteId = id;
  delBtn.innerHTML = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;

  li.appendChild(labelSpan);
  li.appendChild(delBtn);
  return li;
}

function appendCustomFontToList(id, name) {
  const list = document.getElementById('font-list');
  const addBtn = document.getElementById('add-font-btn');
  list.insertBefore(createCustomFontItem(id, name), addBtn);
}

function renderCustomFonts(customFonts) {
  document.querySelectorAll('.font-item--custom').forEach(el => el.remove());
  const list = document.getElementById('font-list');
  const addBtn = document.getElementById('add-font-btn');
  customFonts.forEach(({ id, name }) => {
    list.insertBefore(createCustomFontItem(id, name), addBtn);
  });
}

// ─── مدیریت بخش فرم افزودن فونت ──────────────────────────────────────────

function showAddFontCard() {
  document.getElementById('font-card').style.display = 'none';
  document.getElementById('add-font-card').style.display = '';
  closeAccordion();
  resetAddFontForm();
}

function hideAddFontCard() {
  document.getElementById('add-font-card').style.display = 'none';
  document.getElementById('font-card').style.display = '';
}

function resetAddFontForm() {
  selectedFile = null;
  document.getElementById('font-name-input').value = '';
  document.getElementById('upload-content').style.display = '';
  document.getElementById('upload-selected').style.display = 'none';
  document.getElementById('upload-filename').textContent = '';
  document.getElementById('font-file-input').value = '';
  document.getElementById('upload-zone').classList.remove('has-file', 'drag-over');
  setFormMessage('', '');
}

function setFormMessage(text, type) {
  const el = document.getElementById('form-message');
  el.textContent = text;
  el.className = 'form-message' + (type ? ' ' + type : '');
}

function handleFileSelected(file) {
  if (!file) return;

  const allowed = ['ttf', 'woff', 'woff2', 'otf'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    setFormMessage('فرمت فایل پشتیبانی نمی‌شود.', 'error');
    return;
  }

  selectedFile = file;
  document.getElementById('upload-content').style.display = 'none';
  document.getElementById('upload-selected').style.display = '';
  document.getElementById('upload-filename').textContent = file.name;
  document.getElementById('upload-zone').classList.add('has-file');
  setFormMessage('', '');

  const nameInput = document.getElementById('font-name-input');
  if (!nameInput.value.trim()) {
    nameInput.value = file.name.replace(/\.[^.]+$/, '');
  }
  nameInput.focus();
}

// ─── منطق افزودن و حذف فونت سفارشی ──────────────────────────────────────────

async function handleAddConfirm() {
  const nameInput = document.getElementById('font-name-input');
  const fontName = nameInput.value.trim();

  if (!selectedFile) {
    setFormMessage('لطفاً یک فایل فونت انتخاب کنید.', 'error');
    return;
  }
  if (!fontName) {
    setFormMessage('لطفاً نام فونت را وارد کنید.', 'error');
    nameInput.focus();
    return;
  }

  const confirmBtn = document.getElementById('add-confirm-btn');
  const originalBtnHtml = confirmBtn.innerHTML;

  confirmBtn.disabled = true;
  confirmBtn.textContent = 'در حال پردازش...';

  try {
    const dataUrl = await fileToDataUrl(selectedFile);
    const format = getFormatFromExt(selectedFile.name);
    const id = 'custom_' + Date.now();

    const existing = await loadCustomFonts();
    const isDuplicate = existing.some(f => f.name.toLowerCase() === fontName.toLowerCase());

    if (isDuplicate) {
      setFormMessage('فونتی با این نام قبلاً اضافه شده است.', 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalBtnHtml;
      return;
    }

    const newFont = { id, name: fontName, dataUrl, format };
    await saveCustomFonts([...existing, newFont]);

    POPUP_FONTS[id] = {
      name: fontName,
      fontFaceCss: buildCustomFontFaceCss(fontName, dataUrl, format),
    };

    appendCustomFontToList(id, fontName);
    setFormMessage('فونت با موفقیت افزوده شد!', 'success');

    setTimeout(() => {
      hideAddFontCard();
      setSelectedFont(id, fontName);
      applySelectedFont(id);
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalBtnHtml;
    }, 900);

  } catch (err) {
    console.error(err);
    setFormMessage('خطا در پردازش فونت: ' + err.message, 'error');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalBtnHtml;
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsDataURL(file);
  });
}

// ─── اعمال فونت و راست‌چین ────────────────────────────────────────────────

async function applySelectedFont(fontValue) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (fontValue && POPUP_FONTS[fontValue]) {
    await chrome.storage.local.set({ activeFont: fontValue });
    if (tab) {
      await sendMessageToTab(tab, {
        action: 'applyFont',
        fontName: POPUP_FONTS[fontValue].name || fontValue, 
        fontFaceCss: POPUP_FONTS[fontValue].fontFaceCss,
        overrideCss: buildOverrideCss(POPUP_FONTS[fontValue].name || fontValue),
      });
    }
  } else {
    await chrome.storage.local.remove('activeFont');
    if (tab) {
      await sendMessageToTab(tab, { action: 'removeFont' });
    }
  }
}

async function handleFontItemClick(e) {
  const delBtn = e.target.closest('[data-delete-id]');
  if (delBtn) {
    e.stopPropagation();
    await handleDeleteCustomFont(delBtn.dataset.deleteId);
    return;
  }

  if (e.target.closest('#add-font-btn')) {
    showAddFontCard();
    return;
  }

  const item = e.target.closest('.font-item');
  if (!item || item.id === 'add-font-btn') return;

  const fontValue = item.dataset.value;
  const labelEl = item.querySelector('.font-item-label');
  const fontLabel = labelEl ? labelEl.textContent.trim() : item.textContent.trim();

  setSelectedFont(fontValue, fontLabel);
  closeAccordion();
  await applySelectedFont(fontValue);
}

async function handleDeleteCustomFont(id) {
  if (currentFontValue === id) {
    setSelectedFont('', 'بدون تغییر (پیش‌فرض)');
    await applySelectedFont('');
  }

  const existing = await loadCustomFonts();
  await saveCustomFonts(existing.filter(f => f.id !== id));

  delete POPUP_FONTS[id];

  const li = document.querySelector(`.font-item[data-value="${CSS.escape(id)}"]`);
  if (li) li.remove();
}

async function handleRtlToggle(e) {
  const isActive = e.target.checked;
  await chrome.storage.local.set({ isRTL: isActive });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    await sendMessageToTab(tab, { action: 'applyRTL', isActive });
  }
}

async function handleReset() {
  setSelectedFont('', 'بدون تغییر (پیش‌فرض)');
  document.getElementById('toggle-rtl').checked = false;
  closeAccordion();
  hideAddFontCard();

  await chrome.storage.local.remove(['activeFont', 'isRTL']);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    await sendMessageToTab(tab, { action: 'removeFont' });
    await sendMessageToTab(tab, { action: 'applyRTL', isActive: false });
  }
}

async function updateActiveLogo(tab) {
  if (!tab || !tab.url) return;

  try {
    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase();

    document.querySelectorAll('.logo-glass-box').forEach(box => {
      box.classList.remove('active');
    });

    let targetDomain = '';

    if (hostname.endsWith('deepseek.com')) {
      targetDomain = 'deepseek';
    } else if (hostname.endsWith('chatgpt.com') || hostname.endsWith('openai.com')) {
      targetDomain = 'chatgpt';
    } else if (hostname === 'aistudio.google.com') {
      targetDomain = 'aistudio';
    } else if (hostname.endsWith('claude.ai')) {
      targetDomain = 'claude';
    } else if (hostname.endsWith('qwen.ai') || hostname.endsWith('qwenlm.ai')) {
      targetDomain = 'qwen';
    } else if (hostname.endsWith('perplexity.ai')) {
      targetDomain = 'perplexity';
    } else if (hostname.endsWith('mistral.ai')) {
      targetDomain = 'mistral';
    } else if (hostname.endsWith('grok.com')) {
      targetDomain = 'grok';
    } else if (hostname.includes('notebooklm.google')) {
      targetDomain = 'notebooklm';
    }
    else if (hostname.endsWith('gemini.google.com')) {
      targetDomain = 'gemini';
    }
    else if (hostname.endsWith('z.ai')) {
      targetDomain = 'z-ai';
    }
    else if (hostname.endsWith('arena.ai') || hostname.includes('lmarena.ai')) {
      targetDomain = 'arena';
    }

    if (targetDomain) {
      const activeBox = document.querySelector(`.logo-glass-box[data-domain="${targetDomain}"]`);
      if (activeBox) {
        activeBox.classList.add('active');
      }
    }
  } catch (error) {
    console.warn('error in find address', error);
  }
}

async function filterLogosByRtlSettings() {
  const { rtlSettings = {} } = await chrome.storage.local.get('rtlSettings');

  const domainToSiteKey = {
    'deepseek': 'deepseek.com',
    'chatgpt': 'chatgpt.com',
    'aistudio': 'aistudio.google.com',
    'claude': 'claude.ai',
    'qwen': 'qwen.ai',
    'perplexity': 'perplexity.ai',
    'mistral': 'mistral.ai',
    'grok': 'grok.com',
    'notebooklm': 'notebooklm.google.com',
    'arena': 'arena.ai',
    'z-ai': 'z.ai',
    'gemini': 'gemini.google.com'
  };

  const allBoxes = Array.from(document.querySelectorAll('#logos-group .logo-glass-box'));

  const enabledBoxes = allBoxes.filter(box => {
    const domain = box.getAttribute('data-domain');
    const siteKey = domainToSiteKey[domain];
    return siteKey && rtlSettings[siteKey] === true;
  });

  let boxesToShow = [];

  if (enabledBoxes.length <= 9) {
    boxesToShow = enabledBoxes;
  } else {
    const activeCurrentSiteBox = enabledBoxes.find(box => box.classList.contains('active'));

    if (activeCurrentSiteBox) {
      boxesToShow.push(activeCurrentSiteBox);
      
      const remainingBoxes = enabledBoxes.filter(box => box !== activeCurrentSiteBox);
      boxesToShow = [...boxesToShow, ...remainingBoxes.slice(0, 8)];
    } else {
      boxesToShow = enabledBoxes.slice(0, 9);
    }
  }

  allBoxes.forEach(box => {
    if (boxesToShow.includes(box)) {
      box.style.display = 'flex';
    } else {
      box.style.display = 'none';
    }
  });
}

function setupLogoNavigation() {
  const domainToUrl = {
    'deepseek': 'https://chat.deepseek.com',
    'chatgpt': 'https://chatgpt.com',
    'aistudio': 'https://aistudio.google.com',
    'claude': 'https://claude.ai',
    'qwen': 'https://chat.qwen.ai',
    'perplexity': 'https://perplexity.ai',
    'mistral': 'https://chat.mistral.ai',
    'grok': 'https://grok.com',
    'notebooklm': 'https://notebooklm.google.com',
    'arena': 'https://arena.ai',
    'z-ai': 'https://chat.z.ai',
    'gemini': 'https://gemini.google.com'
  };

  document.querySelectorAll('.logo-glass-box').forEach(box => {
    box.addEventListener('click', function(e) {
      const domain = this.getAttribute('data-domain');
      const url = domainToUrl[domain];
      
      if (url) {
        chrome.tabs.create({ url: url });
      }
    });

    box.style.cursor = 'pointer';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const customFonts = await loadCustomFonts();
  registerCustomFonts(customFonts);
  renderCustomFonts(customFonts);
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('error', function () {
      this.style.display = 'none';
    });
  }

  const { activeFont, isRTL, rtlSettings, siteSettings } = await chrome.storage.local.get(['activeFont', 'isRTL', 'rtlSettings', 'siteSettings']);

  if (!rtlSettings || Object.keys(rtlSettings).length === 0) {
    const defaultRtlSettings = {
      'deepseek.com': true,
      'chatgpt.com': true,
      'aistudio.google.com': true,
      'claude.ai': true,
      'qwen.ai': true,
      'gemini.google.com': true,
      'grok.com': true,
      'z.ai': true,
      'notebooklm.google.com': true,
      'perplexity.ai': true,
      'mistral.ai': true,
      'arena.ai': true
    };
    await chrome.storage.local.set({ rtlSettings: defaultRtlSettings });
  }
  if (!siteSettings || Object.keys(siteSettings).length === 0) {
    const defaultSiteSettings = {
      'chatgpt.com': true,
      'claude.ai': true,
      'gemini.google.com': true,
      'aistudio.google.com': true,
      'deepseek.com': true,
      'grok.com': true,
      'mistral.ai': true,
      'arena.ai': true,
      'z.ai': true,
      'notebooklm.google.com': true,
      'qwen.ai': true,
      'perplexity.ai': true,
      'copilot.microsoft.com': true,
      'google.com': true,
      'wikipedia.org': true,
      'linkedin.com': true,
      'bing.com': true,
      'mail.google.com': true
    };
    await chrome.storage.local.set({ siteSettings: defaultSiteSettings });
  }

  if (activeFont && POPUP_FONTS[activeFont]) {
    const fontEntry = POPUP_FONTS[activeFont];
    const label = fontEntry.name || document.querySelector(`.font-item[data-value="${CSS.escape(activeFont)}"]`)?.textContent.trim() || activeFont;
    setSelectedFont(activeFont, label);
  } else {
    setSelectedFont('', 'بدون تغییر (پیش‌فرض)');
  }

  document.getElementById('toggle-rtl').checked = !!isRTL;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await updateActiveLogo(tab);
  await filterLogosByRtlSettings();
  setupLogoNavigation();


  // رویدادهای آکاردئون
  document.getElementById('accordion-trigger').addEventListener('click', toggleAccordion);
  document.getElementById('font-list').addEventListener('click', handleFontItemClick);

  document.addEventListener('click', e => {
    const trigger = document.getElementById('accordion-trigger');
    const panel = document.getElementById('accordion-panel');
    if (!trigger.contains(e.target) && !panel.contains(e.target)) {
      closeAccordion();
    }
  });

  document.getElementById('toggle-rtl').addEventListener('change', handleRtlToggle);

  // باز کردن صفحه تنظیمات در تب جدید
  document.getElementById('setting-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('setting/setting.html') });
  });

  document.getElementById('back-btn').addEventListener('click', hideAddFontCard);
  document.getElementById('add-confirm-btn').addEventListener('click', handleAddConfirm);

  // رویدادهای انتخاب فایل
  const uploadZone = document.getElementById('upload-zone');
  const fontFileInput = document.getElementById('font-file-input');
  const uploadContent = document.getElementById('upload-content');
  const uploadChangeBtn = document.getElementById('upload-change-btn');

  uploadContent.addEventListener('click', () => fontFileInput.click());

  uploadChangeBtn.addEventListener('click', e => {
    e.stopPropagation();
    selectedFile = null;
    document.getElementById('upload-content').style.display = '';
    document.getElementById('upload-selected').style.display = 'none';
    uploadZone.classList.remove('has-file');
    fontFileInput.value = '';
    setFormMessage('', '');
  });

  fontFileInput.addEventListener('change', e => {
    handleFileSelected(e.target.files[0]);
  });

  // درگ و دراپ فایل
  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFileSelected(e.dataTransfer.files[0]);
  });
});