function pluginNetflix() {
    window.plugin_netflix_ready = true;

    // --------------------------------------------------------
    // CSS inject
    // --------------------------------------------------------
    function injectStyles() {
        $('body').append(`<style>@@include('../plugins/netflix/css/style.css')</style>`);
        console.log('[netflix] styles injected');
    }

    // --------------------------------------------------------
    // Animation 1: MutationObserver — inject .nf-overlay
    // .card__title — sibling of .card__view (not child),
    // поэтому поднимаемся через closest('.card')
    // --------------------------------------------------------
    function initCardOverlays() {
        var area = document.querySelector('.activitys') || document.querySelector('.wrap__content') || document.body;

        function injectOverlays(root) {
            var views = (root || area).querySelectorAll('.card:not(.card--wide) .card__view:not([data-nf-done])');
            var count = 0;

            for (var i = 0; i < views.length; i++) {
                var view = views[i];
                var card = view.closest ? view.closest('.card') : view.parentNode && view.parentNode.parentNode;
                var title = card ? (card.querySelector('.card__title') || {}).textContent || '' : '';

                view.setAttribute('data-nf-done', '1');

                var titleEl = document.createElement('div');
                titleEl.className = 'nf-overlay__title';
                titleEl.textContent = title;

                var overlay = document.createElement('div');
                overlay.className = 'nf-overlay';
                overlay.appendChild(titleEl);

                // год + жанры
                var cardData = card ? card.card_data : null;
                var year = card ? ((card.querySelector('.card__age') || {}).textContent || '') : '';
                var genreStr = '';
                if (cardData) {
                    if (cardData.genres && cardData.genres.length) {
                        // полные данные (страница деталей)
                        genreStr = cardData.genres.slice(0, 2).map(function(g) { return g.name; }).join(' | ');
                    } else if (cardData.genre_ids && cardData.genre_ids.length) {
                        // списки — маппим id→название через встроенный справочник
                        try {
                            var cardType = cardData.original_name ? 'tv' : 'movie';
                            var names = Lampa.Api.sources.tmdb.getGenresNameFromIds(cardType, cardData.genre_ids);
                            genreStr = names.slice(0, 2).join(' | ');
                        } catch(e) {}
                    }
                }
                var metaText = [year, genreStr].filter(Boolean).join('  |  ');
                if (metaText) {
                    var metaEl = document.createElement('div');
                    metaEl.className = 'nf-overlay__meta';
                    metaEl.textContent = metaText;
                    overlay.appendChild(metaEl);
                }

                view.appendChild(overlay);
                count++;
            }

            if (count) console.log('[netflix] overlay injected:', count);
        }

        injectOverlays();

        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes.length) {
                    injectOverlays();
                    break;
                }
            }
        });

        observer.observe(area, { childList: true, subtree: true });
    }

    // --------------------------------------------------------
    // Animation 2: Row whoosh on activity:start
    // Сначала очищаем старые .nf-row-animated — без этого
    // анимация не реплеится при повторном переходе на экран
    // --------------------------------------------------------
    function initRowAnimations() {
        Lampa.Listener.follow('activity', function(e) {
            if (e.type !== 'start') return;

            setTimeout(function() {
                // очистка предыдущей анимации
                var old = document.querySelectorAll('.nf-row-animated');
                for (var i = 0; i < old.length; i++) {
                    old[i].classList.remove('nf-row-animated');
                }

                var rows = document.querySelectorAll('.items-line');
                var count = rows.length;

                for (var j = 0; j < rows.length; j++) {
                    (function(row, idx) {
                        row.style.animationDelay = (idx * 0.07) + 's';
                        row.classList.add('nf-row-animated');
                    })(rows[j], j);
                }

                console.log('[netflix] rows reset and animated:', count);
            }, 50);
        });
    }

    // --------------------------------------------------------
    // Animation 4: Netflix fixed cursor — focused card stays
    // near position 1 (one card visible to the left).
    // Monkey-patches scrollEl.Scroll.update on each row's
    // .scroll element so that when a card gains focus we
    // scroll to cardIndex-1 at the LEFT edge instead of
    // centering the focused card.
    // --------------------------------------------------------
    function initNetflixCursor() {
        function patchScroll(scrollEl) {
            if (!scrollEl || scrollEl._nfPatched) return;
            var scroll = scrollEl.Scroll;
            if (!scroll || typeof scroll.update !== 'function') return;

            var original = scroll.update.bind(scroll);
            scroll.update = function (elem, tocenter) {
                // Only intercept portrait cards in horizontal rows
                if (
                    elem &&
                    elem.classList &&
                    elem.classList.contains('card') &&
                    !elem.classList.contains('card--wide')
                ) {
                    var row = scrollEl.closest ? scrollEl.closest('.items-line') : null;
                    if (row) {
                        var cards = row.querySelectorAll('.card:not(.card--wide)');
                        var idx = -1;
                        for (var i = 0; i < cards.length; i++) {
                            if (cards[i] === elem) { idx = i; break; }
                        }
                        if (idx >= 0) {
                            var target = cards[Math.max(0, idx - 1)];
                            console.log('[netflix] cursor fix: card', idx, '→ scroll to', Math.max(0, idx - 1));
                            return original(target, false);
                        }
                    }
                }
                return original(elem, tocenter);
            };
            scrollEl._nfPatched = true;
            console.log('[netflix] scroll patched on', scrollEl.className || scrollEl.tagName);
        }

        function patchAllRows() {
            var rows = document.querySelectorAll('.items-line .scroll');
            for (var i = 0; i < rows.length; i++) {
                patchScroll(rows[i]);
            }
        }

        // Patch rows that exist now
        patchAllRows();

        // Patch rows added later
        var area = document.querySelector('.activitys') || document.querySelector('.wrap__content') || document.body;
        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes.length) {
                    patchAllRows();
                    break;
                }
            }
        });
        observer.observe(area, { childList: true, subtree: true });
    }

    // --------------------------------------------------------
    // Init
    // --------------------------------------------------------
    function init() {
        injectStyles();
        initCardOverlays();
        initRowAnimations();
        initNetflixCursor();
        console.log('[netflix] plugin ready');
    }

    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') init();
        });
    }
}

if (!window.plugin_netflix_ready) pluginNetflix();
