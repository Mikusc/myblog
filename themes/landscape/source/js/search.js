var searchFunc = function(path, search_id, content_id) {
    'use strict';
    $.ajax({
        url: path,
        dataType: "json",
        success: function( datas ) {
            var $input = document.getElementById(search_id);
            var $resultContent = document.getElementById(content_id);
            if (!$input || !$resultContent) return;
            
            $input.addEventListener('input', function(){
                var str='<ul class=\"search-result-list\">';                
                var keywords = this.value.trim().toLowerCase().split(/[\s\-]+/);
                $resultContent.innerHTML = "";
                if (this.value.trim().length <= 0) {
                    return;
                }
                // perform local searching
                datas.forEach(function(data) {
                    var isMatch = true;
                    var content_index = [];
                    var data_title = data.title ? data.title.trim() : "";
                    var data_content = data.content ? data.content.trim().replace(/<[^>]+>/g,"") : "";
                    var data_url = data.url;
                    var index_title = -1;
                    var index_content = -1;
                    var first_occur = -1;
                    // only match artiles with not empty titles and contents
                    if(data_title != '' && data_content != '') {
                        var keywords = $input.value.trim().toLowerCase().split(/[\s\-]+/);
                        data_title = data_title.toLowerCase();
                        data_content = data_content.toLowerCase();
                        var index_title = data_title.indexOf(keywords[0]);
                        var index_content = data_content.indexOf(keywords[0]);
                        if( index_title < 0 && index_content < 0 ){
                            isMatch = false;
                        } else {
                            if (index_content < 0) {
                                index_content = 0;
                            }
                            if (i == 0) {
                                first_occur = index_content;
                            }
                        }
                    } else {
                        isMatch = false;
                    }
                    // show search results
                    if (isMatch) {
                        str += "<li><a href='"+ data_url +"' class='search-result-title'>"+ data_title +"</a>";
                        var content = data.content.trim().replace(/<[^>]+>/g,"");
                        if (first_occur >= 0) {
                            // cut out 100 characters
                            var start = first_occur - 20;
                            var end = first_occur + 80;
                            if(start < 0){
                                start = 0;
                            }
                            if(start == 0){
                                end = 100;
                            }
                            if(end > content.length){
                                end = content.length;
                            }
                            var match_content = content.substr(start, end); 
                            // highlight all keywords
                            keywords.forEach(function(keyword){
                                var regS = new RegExp(keyword, "gi");
                                match_content = match_content.replace(regS, "<em class=\"search-keyword\">"+keyword+"</em>");
                            });
                            
                            str += "<p class=\"search-result\">" + match_content +"...</p>"
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
