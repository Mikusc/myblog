var searchFunc = function(path, search_id, content_id) {
    'use strict';
    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function(char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function escapeRegExp(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function currentLanguage() {
        return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'zh';
    }

    function translate(key) {
        var fallback = {
            zh: {
                'search.results': '{count} 条结果',
                'search.noResults': '没有找到匹配的文章。',
                'search.error': '搜索索引加载失败。'
            },
            en: {
                'search.results': '{count} results',
                'search.noResults': 'No matching posts found.',
                'search.error': 'Failed to load search index.'
            }
        };
        var lang = currentLanguage();
        if (window.MikuscI18n && typeof window.MikuscI18n.translate === 'function') {
            return window.MikuscI18n.translate(lang, key) || fallback[lang][key] || '';
        }
        return fallback[lang][key] || '';
    }

    $.ajax({
        url: path,
        dataType: "json",
        success: function(datas) {
            var $input = document.getElementById(search_id);
            var $resultContent = document.getElementById(content_id);
            if (!$input || !$resultContent) return;

            var debounceTimer = null;
            var lastKeywords = [];

            function renderResults(keywords) {
                var str = '<ul class="search-result-list">';
                var resultCount = 0;
                $resultContent.innerHTML = "";

                if (!keywords.length) return;

                datas.forEach(function(data) {
                    var data_title = data.title ? data.title.trim() : "";
                    var data_content = data.content ? data.content.trim().replace(/<[^>]+>/g, "") : "";
                    var data_url = data.url || "";
                    var title_lower = data_title.toLowerCase();
                    var content_lower = data_content.toLowerCase();
                    var first_occur = -1;

                    if (!data_title || !data_content) return;

                    var isMatch = keywords.every(function(keyword) {
                        var title_index = title_lower.indexOf(keyword);
                        var content_index = content_lower.indexOf(keyword);
                        if (content_index >= 0 && (first_occur < 0 || content_index < first_occur)) {
                            first_occur = content_index;
                        }
                        return title_index >= 0 || content_index >= 0;
                    });

                    if (isMatch) {
                        resultCount += 1;
                        str += '<li><a href="' + escapeHtml(encodeURI(data_url)) + '" class="search-result-title">' + escapeHtml(data_title) + '</a>';
                        var start = first_occur > 20 ? first_occur - 20 : 0;
                        var end = first_occur >= 0 ? first_occur + 80 : 100;
                        if (end > data_content.length) end = data_content.length;

                        var match_content = escapeHtml(data_content.substring(start, end));
                        keywords.forEach(function(keyword) {
                            var regS = new RegExp(escapeRegExp(escapeHtml(keyword)), "gi");
                            match_content = match_content.replace(regS, '<em class="search-keyword">$&</em>');
                        });

                        if (match_content) {
                            str += '<p class="search-result">' + match_content + '...</p>';
                        }
                        str += '</li>';
                    }
                });
                str += '</ul>';

                if (resultCount > 0) {
                    var countLabel = translate('search.results').replace('{count}', String(resultCount));
                    $resultContent.innerHTML = '<div class="search-result-head">' + escapeHtml(countLabel) + '</div>' + str;
                } else {
                    $resultContent.innerHTML = '<p class="search-empty">' + escapeHtml(translate('search.noResults')) + '</p>';
                }
            }

            $input.addEventListener('input', function() {
                var keywords = this.value.trim().toLowerCase().split(/[\s\-]+/).filter(Boolean);
                lastKeywords = keywords.slice();
                clearTimeout(debounceTimer);
                if (!keywords.length) {
                    renderResults([]);
                    return;
                }
                debounceTimer = setTimeout(function() {
                    renderResults(keywords);
                }, 180);
            });

            // Keep visible results in sync when the site language is toggled.
            document.addEventListener('mikusc:language-applied', function() {
                if (lastKeywords.length > 0) renderResults(lastKeywords);
            });
        },
        error: function() {
            var $resultContent = document.getElementById(content_id);
            if ($resultContent) {
                $resultContent.innerHTML = '<p class="search-empty">' + escapeHtml(translate('search.error')) + '</p>';
            }
        }
    });
}

// Init logic
$(document).ready(function(){
    // Create a container for search results
    var $resultContainer = $('<div id="local-search-result"></div>');
    $('#search-form-wrap').append($resultContainer);

    var path = "/search.json";
    // The theme search form already uses .search-form-input; assign the id
    // expected by the vanilla JS helper above.
    $('.search-form-input').attr('id', 'local-search-input');

    // Prevent default form submit
    $('.search-form').on('submit', function(e){
        e.preventDefault();
    });

    searchFunc(path, 'local-search-input', 'local-search-result');
});
