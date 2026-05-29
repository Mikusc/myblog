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

    $.ajax({
        url: path,
        dataType: "json",
        success: function( datas ) {
            var $input = document.getElementById(search_id);
            var $resultContent = document.getElementById(content_id);
            if (!$input || !$resultContent) return;
            
            $input.addEventListener('input', function(){
                var str = '<ul class=\"search-result-list\">';
                var keywords = this.value.trim().toLowerCase().split(/[\s\-]+/).filter(Boolean);
                $resultContent.innerHTML = "";
                if (keywords.length <= 0) {
                    return;
                }
                // perform local searching
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

                    // show search results
                    if (isMatch) {
                        str += "<li><a href='" + encodeURI(data_url) + "' class='search-result-title'>" + escapeHtml(data_title) + "</a>";
                        var start = first_occur > 20 ? first_occur - 20 : 0;
                        var end = first_occur >= 0 ? first_occur + 80 : 100;
                        if (end > data_content.length) end = data_content.length;

                        var match_content = escapeHtml(data_content.substring(start, end));
                        keywords.forEach(function(keyword) {
                            var regS = new RegExp(escapeRegExp(escapeHtml(keyword)), "gi");
                            match_content = match_content.replace(regS, "<em class=\"search-keyword\">$&</em>");
                        });

                        if (match_content) {
                            str += "<p class=\"search-result\">" + match_content + "...</p>";
                        }
                        str += "</li>";
                    }
                });
                str += "</ul>";
                $resultContent.innerHTML = str;
            });
        }
    });
}

// Init logic
$(document).ready(function(){
    // Create a container for search results
    var $resultContainer = $('<div id="local-search-result"></div>');
    $('#search-form-wrap').append($resultContainer);

    var path = "/search.json";
    // We assume the input has this class. Check header.ejs
    // class="search-form-input"
    // We need to give ids to the input and result container for the vanilla JS helper above, 
    // or rewrite the helper to use jQuery/selectors. 
    // Existing helper uses getElementById. Let's add an ID to the input dynamically.
    $('.search-form-input').attr('id', 'local-search-input');
    
    // Prevent default form submit
    $('.search-form').on('submit', function(e){
        e.preventDefault();
    });

    searchFunc(path, 'local-search-input', 'local-search-result');
});
