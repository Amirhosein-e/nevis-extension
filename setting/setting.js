// ===== متغیرهای سراسری =====
const trashIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const plusIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

// ===== توابع ذخیره و بازیابی اطلاعات =====
function saveSitesToStorage() {
    const siteSettings = {};
    
    // سایت‌های فعال
    document.querySelectorAll('#active-sites .site-badge').forEach(badge => {
        siteSettings[badge.getAttribute('data-url')] = true;
    });
    
    // سایت‌های غیرفعال (مستثنی شده)
    document.querySelectorAll('#removed-sites .site-badge').forEach(badge => {
        siteSettings[badge.getAttribute('data-url')] = false;
    });
    
    chrome.storage.local.set({ siteSettings });
}

async function loadSitesFromStorage() {
    const { siteSettings } = await chrome.storage.local.get('siteSettings');
    
    if (!siteSettings) {
        saveSitesToStorage();
        return;
    }

    for (const [url, isActive] of Object.entries(siteSettings)) {
        const badge = document.querySelector(`.site-badge[data-url="${url}"]`);
        
        if (badge) {
            const currentParentId = badge.parentElement.id;
            const targetParentId = isActive ? 'active-sites' : 'removed-sites';
            
            if (currentParentId !== targetParentId) {
                const targetList = document.getElementById(targetParentId);
                const btn = badge.querySelector('.badge-action-btn');
                
                if (isActive) {
                    btn.className = 'badge-action-btn btn-remove';
                    btn.title = 'حذف';
                    btn.innerHTML = trashIcon;
                    badge.style.opacity = '1';
                    const addBtn = targetList.querySelector('.add-site-btn');
                    targetList.insertBefore(badge, addBtn);
                } else {
                    btn.className = 'badge-action-btn btn-add';
                    btn.title = 'افزودن مجدد';
                    btn.innerHTML = plusIcon;
                    badge.style.opacity = '0.6';
                    targetList.appendChild(badge);
                }
            }
        } else if (isActive) {
            renderCustomBadge(url);
        }
    }
}

// ===== توابع رابط کاربری (به صورت سراسری) =====
window.moveSite = function(buttonElement, targetListId) {
    const badge = buttonElement.closest('.site-badge');
    const targetList = document.getElementById(targetListId);
    const isCustomSite = badge.getAttribute('data-custom') === 'true';

    // اگر سایت دستی اضافه شده بود و کاربر حذفش کرد، کاملاً پاکش کن
    if (targetListId === 'removed-sites' && isCustomSite) {
        badge.style.transform = 'scale(0)';
        setTimeout(() => {
            badge.remove();
            saveSitesToStorage();
        }, 150);
        return;
    }

    if (targetListId === 'removed-sites') {
        buttonElement.className = 'badge-action-btn btn-add';
        buttonElement.title = 'افزودن مجدد';
        buttonElement.innerHTML = plusIcon;
        badge.style.opacity = '0.6';
    } else {
        buttonElement.className = 'badge-action-btn btn-remove';
        buttonElement.title = 'حذف';
        buttonElement.innerHTML = trashIcon;
        badge.style.opacity = '1';
    }

    badge.style.transform = 'scale(0.8)';
    setTimeout(() => {
        const addBtn = targetList.querySelector('.add-site-btn');
        if (addBtn && targetListId === 'active-sites') {
            targetList.insertBefore(badge, addBtn);
        } else {
            targetList.appendChild(badge);
        }
        badge.style.transform = 'scale(1)';
        saveSitesToStorage();
    }, 150);
};

function openAddSiteModal() {
    document.getElementById('addSiteModal').classList.add('active');
    document.getElementById('siteUrl').value = '';
    document.getElementById('urlError').classList.remove('active');
}

function closeAddSiteModal() {
    document.getElementById('addSiteModal').classList.remove('active');
}

function extractDomain(url) {
    try {
        if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
        }
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return null;
    }
}

async function getFavicon(domain) {
    const methods = [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `https://${domain}/favicon.ico`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://api.faviconkit.com/${domain}/64`
    ];
    
    try {
        const response = await fetch(methods[0]);
        if (response.ok) {
            return methods[0];
        }
    } catch (e) {}
    return null;
}

function createDefaultFavicon(domain) {
    const firstLetter = domain.charAt(0).toUpperCase();
    const div = document.createElement('div');
    div.className = 'default-favicon';
    div.textContent = firstLetter;
    return div;
}

function isDuplicateSite(domain) {
    const activeSites = document.getElementById('active-sites');
    const removedSites = document.getElementById('removed-sites');
    const allBadges = [...activeSites.querySelectorAll('.site-badge'), ...removedSites.querySelectorAll('.site-badge')];
    return allBadges.some(badge => badge.getAttribute('data-url') === domain);
}

window.renderCustomBadge = async function(domain) {
    const faviconUrl = await getFavicon(domain);
    const newBadge = document.createElement('div');
    newBadge.className = 'site-badge';
    newBadge.setAttribute('data-url', domain);
    newBadge.setAttribute('title', domain);
    newBadge.setAttribute('data-custom', 'true');

    if (faviconUrl) {
        const img = document.createElement('img');
        img.src = faviconUrl;
        img.className = 'badge-logo';
        img.alt = domain;
        img.onerror = function() {
            this.replaceWith(createDefaultFavicon(domain));
        };
        newBadge.appendChild(img);
    } else {
        newBadge.appendChild(createDefaultFavicon(domain));
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'badge-action-btn btn-remove';
    removeBtn.title = 'حذف';
    removeBtn.innerHTML = trashIcon;
    // نکته: onclick دستی حذف شد چون Event Delegation در پایین انجام می‌شود
    newBadge.appendChild(removeBtn);

    const activeSites = document.getElementById('active-sites');
    const addSiteBtn = activeSites.querySelector('.add-site-btn');
    activeSites.insertBefore(newBadge, addSiteBtn);
};

async function addNewSite() {
    const urlInput = document.getElementById('siteUrl');
    const errorMsg = document.getElementById('urlError');
    const addBtn = document.getElementById('addSiteBtn');
    const addBtnText = document.getElementById('addBtnText');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const url = urlInput.value.trim();
    if (!url) {
        errorMsg.textContent = 'لطفاً یک آدرس وارد کنید';
        errorMsg.classList.add('active');
        return;
    }

    const domain = extractDomain(url);
    if (!domain) {
        errorMsg.textContent = 'آدرس وارد شده معتبر نیست';
        errorMsg.classList.add('active');
        return;
    }

    if (isDuplicateSite(domain)) {
        errorMsg.textContent = 'این سایت قبلاً اضافه شده است';
        errorMsg.classList.add('active');
        return;
    }

    errorMsg.classList.remove('active');
    addBtn.disabled = true;
    addBtnText.textContent = 'در حال افزودن...';
    loadingSpinner.classList.add('active');

    try {
        await window.renderCustomBadge(domain);
        setTimeout(() => {
            closeAddSiteModal();
            saveSitesToStorage();
        }, 300);
    } catch (error) {
        console.error('Error adding site:', error);
        errorMsg.textContent = 'خطا در افزودن سایت. لطفاً دوباره تلاش کنید';
        errorMsg.classList.add('active');
    } finally {
        addBtn.disabled = false;
        addBtnText.textContent = 'افزودن';
        loadingSpinner.classList.remove('active');
    }
}

// ===== رویدادها (Event Listeners) =====
document.addEventListener('DOMContentLoaded', async () => {
    // بارگذاری تنظیمات فونت‌ها
    await loadSitesFromStorage();

    // ------------------------------------------
    // رویدادهای مودال
    // ------------------------------------------
    document.getElementById('open-add-site-modal').addEventListener('click', openAddSiteModal);
    document.getElementById('modal-close-btn').addEventListener('click', closeAddSiteModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeAddSiteModal);
    document.getElementById('addSiteBtn').addEventListener('click', addNewSite);

    document.getElementById('siteUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addNewSite();
    });

    document.getElementById('siteUrl').addEventListener('input', function() {
        document.getElementById('urlError').classList.remove('active');
    });

    // ------------------------------------------
    // سیستم یکپارچه برای کلیک‌های حذف و اضافه
    // (Event Delegation)
    // ------------------------------------------
    document.getElementById('active-sites').addEventListener('click', (e) => {
        const btn = e.target.closest('.badge-action-btn');
        if (btn) {
            window.moveSite(btn, 'removed-sites');
        }
    });

    document.getElementById('removed-sites').addEventListener('click', (e) => {
        const btn = e.target.closest('.badge-action-btn');
        if (btn) {
            window.moveSite(btn, 'active-sites');
        }
    });

    // ------------------------------------------
    // منطق ذخیره و بازیابی تب RTL
    // ------------------------------------------
    const rtlToggles = document.querySelectorAll('.rtl-toggle');
    
    // خواندن مقادیر ذخیره شده
    chrome.storage.local.get('rtlSettings', ({ rtlSettings = {} }) => {
        rtlToggles.forEach(toggle => {
            const site = toggle.getAttribute('data-site');
            
            // اعمال وضعیت ذخیره شده
            if (rtlSettings[site] !== undefined) {
                toggle.checked = rtlSettings[site];
            }

            // ذخیره هنگام تغییر سوئیچ
            toggle.addEventListener('change', (e) => {
                rtlSettings[site] = e.target.checked;
                chrome.storage.local.set({ rtlSettings });
            });
        });
    });
});