// Main JavaScript for portfolio site

const ROUTE_ORDER = { '/': 0, '/about': 1, '/contact': 2 };
const ROUTE_PATHS = ['/', '/about', '/contact'];

function updateLayoutOffsets() {
    const root = document.documentElement;
    if (!root) return;

    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');

    if (header) {
        root.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    }

    if (footer) {
        root.style.setProperty('--footer-height', `${Math.ceil(footer.getBoundingClientRect().height)}px`);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try { updateLayoutOffsets(); } catch (e) { console.warn('updateLayoutOffsets', e); }
    try { highlightActiveNav(); } catch (e) { console.warn('highlightActiveNav', e); }
    try { initPageTransitions(); } catch (e) { console.warn('initPageTransitions', e); }
    try { addSmoothScrolling(); } catch (e) { console.warn('addSmoothScrolling', e); }
    try { initProjectCards(); } catch (e) { console.warn('initProjectCards', e); }
    try { initProjectsGallery(); } catch (e) { console.warn('initProjectsGallery', e); }
    try { initProjectFilters(); } catch (e) { console.warn('initProjectFilters', e); }
    try { initProjectsHintToast(); } catch (e) { console.warn('initProjectsHintToast', e); }
    try { initContactPage(); } catch (e) { console.warn('initContactPage', e); }

    let layoutResizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(layoutResizeTimeout);
        layoutResizeTimeout = setTimeout(function() {
            updateLayoutOffsets();
        }, 120);
    });

    window.addEventListener('load', function() {
        updateLayoutOffsets();
    }, { once: true });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() {
            updateLayoutOffsets();
        });
    }
});

function initPageTransitions() {
    const internalLinks = document.querySelectorAll('.header a[href^="/"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href.indexOf('#') === 0) return;
            const targetPath = new URL(href, window.location.origin).pathname;
            if (ROUTE_ORDER[targetPath] === undefined) return;
            const currentPath = window.location.pathname;
            if (targetPath === currentPath) return;

            e.preventDefault();
            navigateWithTransition(href, targetPath);
        });
    });

    window.addEventListener('popstate', function() {
        loadPageContent(window.location.pathname, false);
    });
}

function navigateWithTransition(href, targetPath) {
    const currentPath = window.location.pathname;
    const currentIndex = ROUTE_ORDER[currentPath] ?? 0;
    const targetIndex = ROUTE_ORDER[targetPath] ?? 0;
    const goForward = targetIndex > currentIndex;

    fetch(href, { headers: { Accept: 'text/html' } })
        .then(r => r.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMain = doc.querySelector('main.main-content .main-content-inner');
            const newContentHTML = newMain ? newMain.innerHTML : (doc.querySelector('main.main-content')?.innerHTML || '');
            if (!newContentHTML) {
                window.location.href = href;
                return;
            }
            runSlideTransition(targetPath, newContentHTML, goForward, href);
        })
        .catch(() => { window.location.href = href; });
}

function runSlideTransition(targetPath, newContentHTML, goForward, fullHref) {
    const main = document.querySelector('main.main-content');
    const inner = document.getElementById('mainContentInner');
    if (!main || !inner) return;

    const currentHTML = inner.innerHTML;
    const viewport = document.createElement('div');
    viewport.className = 'main-transition-viewport';
    viewport.dataset.direction = goForward ? 'forward' : 'back';

    const panelCurrent = document.createElement('div');
    panelCurrent.className = 'slide-panel current';
    panelCurrent.innerHTML = currentHTML;

    const panelNext = document.createElement('div');
    panelNext.className = 'slide-panel next slide-initial';
    panelNext.innerHTML = newContentHTML;

    viewport.appendChild(panelCurrent);
    viewport.appendChild(panelNext);

    main.classList.add('is-transitioning');
    main.innerHTML = '';
    main.appendChild(viewport);

    let finished = false;
    function finish() {
        if (finished) return;
        finished = true;
        main.classList.remove('is-transitioning');
        main.innerHTML = '<div class="main-content-inner" id="mainContentInner">' + newContentHTML + '</div>';
        history.pushState({ path: targetPath }, '', fullHref);
        highlightActiveNav();
        updateLayoutOffsets();
        reinitPageModules();
    }

    panelNext.addEventListener('transitionend', function onEnd(e) {
        if (e.target !== panelNext || e.propertyName !== 'transform') return;
        finish();
    }, { once: true });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            panelNext.classList.remove('slide-initial');
        });
    });

    setTimeout(finish, 450);
}

function loadPageContent(path, addHistory) {
    const href = path === '/' ? '/' : path;
    fetch(href, { headers: { Accept: 'text/html' } })
        .then(r => r.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMain = doc.querySelector('main.main-content .main-content-inner');
            const newContentHTML = newMain ? newMain.innerHTML : (doc.querySelector('main.main-content')?.innerHTML || '');
            if (!newContentHTML) return;
            const main = document.querySelector('main.main-content');
            const inner = document.getElementById('mainContentInner');
            if (!main || !inner) return;
            inner.innerHTML = newContentHTML;
            if (addHistory) history.pushState({ path: path }, '', href);
            highlightActiveNav();
            reinitPageModules();
        })
        .catch(() => { window.location.href = href; });
}

function reinitPageModules() {
    try { updateLayoutOffsets(); } catch (e) { console.warn('updateLayoutOffsets', e); }
    try { addSmoothScrolling(); } catch (e) { console.warn('addSmoothScrolling', e); }
    try { initProjectCards(); } catch (e) { console.warn('initProjectCards', e); }
    try { initProjectsGallery(); } catch (e) { console.warn('initProjectsGallery', e); }
    try { initProjectFilters(); } catch (e) { console.warn('initProjectFilters', e); }
    try { initProjectsHintToast(); } catch (e) { console.warn('initProjectsHintToast', e); }
    try { initContactPage(); } catch (e) { console.warn('initContactPage', e); }
    if ('IntersectionObserver' in window) try { initScrollAnimations(); } catch (e) { console.warn('initScrollAnimations', e); }
}

function initProjectsHintToast() {
    var toast = document.getElementById('projectsHintToast');
    if (!toast) return;
    toast.classList.add('visible');
    setTimeout(function() {
        toast.classList.remove('visible');
    }, 5000);
}

function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            link.classList.add('active');
        }
    });
}

function addSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initProjectCards() {
    const flipWrappers = document.querySelectorAll('.project-card-flip');

    flipWrappers.forEach(wrapper => {
        const demoUrl = (wrapper.getAttribute('data-demo-url') || '').trim();
        const screenshotUrl = (wrapper.getAttribute('data-screenshot') || '').trim();
        const screenshotEl = wrapper.querySelector('.project-screenshot');
        const demoBtn = wrapper.querySelector('.project-demo-btn');

        if (screenshotEl) {
            if (screenshotUrl) {
                screenshotEl.style.backgroundImage = `url(${screenshotUrl})`;
                screenshotEl.classList.remove('no-image');
            } else {
                screenshotEl.classList.add('no-image');
                screenshotEl.textContent = 'No screenshot';
            }
        }
        if (demoBtn) {
            if (demoUrl) {
                demoBtn.href = demoUrl;
                demoBtn.classList.remove('no-url');
                try {
                    const host = new URL(demoUrl).hostname.replace(/^www\./, '');
                    demoBtn.textContent = host;  // 只显示域名，不加「访问」
                } catch (_) {
                    demoBtn.textContent = 'View more';
                }
            } else {
                demoBtn.href = '#';
                demoBtn.classList.add('no-url');
                demoBtn.textContent = 'No demo link';
            }
            demoBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (demoUrl) {
                    e.preventDefault();
                    window.open(demoUrl, '_blank', 'noopener,noreferrer');
                } else {
                    e.preventDefault();
                }
            });
        }

        function doFlip(el) {
            if (!el || !el.classList) return;
            el.classList.toggle('flipped');
        }
        function isDemoBtn(target) {
            return target && target.closest && target.closest('.project-demo-btn');
        }
        wrapper.addEventListener('click', function(e) {
            if (isDemoBtn(e.target)) return;
            if (e.pointerType === 'touch') return;
            doFlip(this);
        });
        var pointerDown = { x: 0, y: 0 };
        wrapper.addEventListener('pointerdown', function(e) {
            pointerDown.x = e.clientX;
            pointerDown.y = e.clientY;
        }, { passive: true });
        wrapper.addEventListener('pointerup', function(e) {
            if (e.pointerType !== 'touch') return;
            if (isDemoBtn(e.target)) return;
            var dx = e.clientX - pointerDown.x;
            var dy = e.clientY - pointerDown.y;
            if (dx * dx + dy * dy >= 25) return;
            doFlip(this);
            e.preventDefault();
        });
    });
}

// Add fade-in animation on scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Initialize scroll animations if supported
if ('IntersectionObserver' in window) {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
}

// Projects Gallery Functions
function initProjectsGallery() {
    const gallery = document.getElementById('projectsGallery');
    const prevBtn = document.querySelector('.gallery-nav.prev');
    const nextBtn = document.querySelector('.gallery-nav.next');
    const indicators = document.getElementById('galleryIndicators');
    
    if (!gallery || !prevBtn || !nextBtn) return;
    
    const gap = parseInt(getComputedStyle(gallery).gap, 10) || 24;
    const getVisibleCards = () => gallery.querySelectorAll('.project-card-flip:not(.project-card-hidden)');
    const getCardWidth = () => {
        const vis = getVisibleCards();
        return (vis.length && vis[0] ? vis[0].offsetWidth + gap : 320 + gap);
    };
    let cardWidth = getCardWidth();
    let currentIndex = 0;
    let totalCards = getVisibleCards().length;
    let isScrolling = false;

    const getPaddingOffset = () => parseFloat(getComputedStyle(gallery).paddingLeft) || 0;

    const getCardsPerView = () => {
        const paddingOffset = getPaddingOffset();
        const visibleWidth = gallery.offsetWidth - (paddingOffset * 2);
        const cw = getCardWidth();
        return Math.max(1, Math.floor(visibleWidth / cw));
    };
    
    let cardsPerView = getCardsPerView();
    let totalPages = Math.max(1, Math.ceil(totalCards / cardsPerView));

    function refreshCardWidth() {
        totalCards = getVisibleCards().length;
        cardWidth = getCardWidth();
        cardsPerView = getCardsPerView();
        totalPages = Math.max(1, Math.ceil(totalCards / cardsPerView));
    }
    
    function rebuildIndicators() {
        totalCards = getVisibleCards().length;
        cardsPerView = getCardsPerView();
        totalPages = Math.max(1, Math.ceil(totalCards / cardsPerView));
        if (indicators) {
            indicators.innerHTML = '';
            for (let i = 0; i < totalCards; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'gallery-indicator';
                if (i === 0) indicator.classList.add('active');
                indicator.addEventListener('click', () => scrollToCard(i));
                indicators.appendChild(indicator);
            }
        }
        currentIndex = 0;
        const vis = getVisibleCards();
        if (vis.length) gallery.scrollLeft = Math.max(0, vis[0].offsetLeft - getPaddingOffset());
        updateButtons();
        updateIndicators();
    }
    
    // Create indicators - 为每个项目创建一个指示器
    if (indicators) {
        indicators.innerHTML = '';
        for (let i = 0; i < totalCards; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'gallery-indicator';
            if (i === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => scrollToCard(i));
            indicators.appendChild(indicator);
        }
    }
    
    function updateButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= totalPages - 1;
    }
    
    function updateIndicators() {
        if (indicators) {
            const indicatorElements = indicators.querySelectorAll('.gallery-indicator');
            const vis = getVisibleCards();
            const scrollPos = gallery.scrollLeft + getPaddingOffset();
            let activeCardIndex = 0;
            for (let i = 0; i < vis.length; i++) {
                if (vis[i].offsetLeft + vis[i].offsetWidth / 2 <= scrollPos + gallery.offsetWidth / 2) activeCardIndex = i;
            }
            activeCardIndex = Math.min(activeCardIndex, vis.length - 1);
            currentIndex = activeCardIndex;
            indicatorElements.forEach((ind, i) => {
                ind.classList.toggle('active', i === activeCardIndex);
            });
        }
    }
    
    function scrollToPage(page) {
        const targetIndex = Math.max(0, Math.min(page, totalPages - 1));
        if (targetIndex === currentIndex) return; // 如果已经在目标页面，不执行
        
        currentIndex = targetIndex;
        const currentPaddingOffset = getPaddingOffset();
        const cw = getCardWidth();
        const scrollPosition = currentPaddingOffset + (currentIndex * cardsPerView * cw);
        
        isScrolling = true;
        gallery.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        updateButtons();
        
        // 延迟更新指示器，等待滚动完成
        setTimeout(() => {
            isScrolling = false;
            updateIndicators();
        }, 600);
    }
    
    function scrollToCard(cardIndex) {
        const vis = getVisibleCards();
        if (vis[cardIndex]) {
            isScrolling = true;
            gallery.scrollTo({ left: Math.max(0, vis[cardIndex].offsetLeft - getPaddingOffset()), behavior: 'smooth' });
            setTimeout(() => { isScrolling = false; updateIndicators(); }, 600);
        }
    }
    
    // 按钮事件监听
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex > 0 && !isScrolling) {
            scrollToPage(currentIndex - 1);
        }
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex < totalPages - 1 && !isScrolling) {
            scrollToPage(currentIndex + 1);
        }
    });
    
    // Update on scroll
    let scrollTimeout;
    gallery.addEventListener('scroll', () => {
        if (isScrolling) return;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            updateIndicators();
            updateButtons();
        }, 100);
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            refreshCardWidth();
            updateButtons();
            updateIndicators();
        }, 250);
    });

    setTimeout(() => {
        refreshCardWidth();
        gallery.scrollLeft = getPaddingOffset();
        updateIndicators();
    }, 100);
    
    updateButtons();
    updateIndicators();
    
    // Enable mouse drag scrolling
    let isDown = false;
    let startX;
    let scrollLeft;
    
    gallery.addEventListener('mousedown', (e) => {
        if (e.target.closest('.project-card-flip')) return;
        isDown = true;
        gallery.style.cursor = 'grabbing';
        startX = e.pageX - gallery.offsetLeft;
        scrollLeft = gallery.scrollLeft;
    });
    
    gallery.addEventListener('mouseleave', () => {
        isDown = false;
        gallery.style.cursor = 'grab';
    });
    
    gallery.addEventListener('mouseup', () => {
        isDown = false;
        gallery.style.cursor = 'grab';
    });
    
    gallery.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - gallery.offsetLeft;
        const walk = (x - startX) * 2;
        gallery.scrollLeft = scrollLeft - walk;
    });
    
    gallery.style.cursor = 'grab';
    
    window.addEventListener('projectFilterChange', function() {
        rebuildIndicators();
    });
}

// Projects filter: search + label filter (All = show all; dim All and select labels = show only those)
function initProjectFilters() {
    const gallery = document.getElementById('projectsGallery');
    const searchInput = document.getElementById('projectsSearchInput');
    const chipsContainer = document.getElementById('projectsLabelChips');
    if (!gallery || !chipsContainer) return;
    
    const cards = gallery.querySelectorAll('.project-card-flip');
    function getCardTags(card) {
        const techEl = card.querySelector('.project-tech');
        if (!techEl) return [];
        return (techEl.textContent || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    }
    const allTags = {};
    cards.forEach(function(card) {
        getCardTags(card).forEach(function(tag) {
            allTags[tag] = true;
        });
    });
    const tagList = Object.keys(allTags).sort();
    
    var allChip;
    var allSelected = true;
    
    function addChip(label, isAll) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'project-label-chip' + (isAll ? ' project-label-chip-all' : '');
        chip.textContent = label;
        chip.setAttribute('data-tag', label);
        chip.addEventListener('click', function() {
            if (isAll) {
                allSelected = !allSelected;
                chip.classList.toggle('selected', allSelected);
                if (allSelected) {
                    chipsContainer.querySelectorAll('.project-label-chip:not(.project-label-chip-all)').forEach(function(c) { c.classList.remove('selected'); });
                }
            } else {
                if (allSelected) {
                    allSelected = false;
                    if (allChip) allChip.classList.remove('selected');
                    chipsContainer.querySelectorAll('.project-label-chip:not(.project-label-chip-all)').forEach(function(c) { c.classList.remove('selected'); });
                    chip.classList.add('selected');
                } else {
                    chip.classList.toggle('selected');
                }
            }
            applyFilter();
        });
        chipsContainer.appendChild(chip);
        if (isAll) allChip = chip;
    }
    
    addChip('All', true);
    allChip.classList.add('selected');
    tagList.forEach(function(tag) {
        addChip(tag, false);
    });
    
    var clearBtn = document.getElementById('projectsSearchClear');
    function updateClearVisibility() {
        if (clearBtn) clearBtn.classList.toggle('visible', searchInput && searchInput.value.trim().length > 0);
    }
    if (searchInput) {
        var searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilter, 200);
            updateClearVisibility();
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                updateClearVisibility();
                applyFilter();
            }
        });
    }
    
    function applyFilter() {
        var selectedTags = {};
        if (!allSelected) {
            chipsContainer.querySelectorAll('.project-label-chip.selected:not(.project-label-chip-all)').forEach(function(chip) {
                selectedTags[chip.getAttribute('data-tag')] = true;
            });
        }
        var query = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
        cards.forEach(function(card) {
            var tags = getCardTags(card);
            var matchesLabel = allSelected || tags.some(function(t) { return selectedTags[t]; });
            var title = (card.querySelector('.project-title') && card.querySelector('.project-title').textContent) || '';
            var desc = (card.querySelector('.project-description') && card.querySelector('.project-description').textContent) || '';
            var tech = (card.querySelector('.project-tech') && card.querySelector('.project-tech').textContent) || '';
            var text = (title + ' ' + desc + ' ' + tech).toLowerCase();
            var matchesSearch = !query || text.indexOf(query) !== -1;
            if (matchesSearch && matchesLabel) {
                card.classList.remove('project-card-hidden');
            } else {
                card.classList.add('project-card-hidden');
            }
        });
        window.dispatchEvent(new CustomEvent('projectFilterChange'));
    }
}

// Contact page: copy-to-clipboard and toast
function initContactPage() {
    const copyBtn = document.querySelector('.contact-copy-btn');
    const toast = document.getElementById('contactToast');
    const emailCard = document.querySelector('.contact-card-email .contact-value');
    if (!copyBtn || !toast) return;

    copyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const email = emailCard ? emailCard.getAttribute('data-email') || emailCard.textContent.trim() : '';
        if (!email) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email).then(function() {
                showContactToast(copyBtn, toast);
            }).catch(function() {
                fallbackCopy(email, copyBtn, toast);
            });
        } else {
            fallbackCopy(email, copyBtn, toast);
        }
    });
}

function fallbackCopy(text, copyBtn, toast) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showContactToast(copyBtn, toast);
    } catch (err) { /* ignore */ }
    document.body.removeChild(ta);
}

function showContactToast(copyBtn, toast) {
    copyBtn.classList.add('copied');
    toast.classList.add('visible');
    setTimeout(function() {
        toast.classList.remove('visible');
    }, 2000);
    setTimeout(function() {
        copyBtn.classList.remove('copied');
    }, 2500);
}
