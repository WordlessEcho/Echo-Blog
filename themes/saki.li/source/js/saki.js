var Home = location.href,
    //Pages = 4,
    xhr,
    xhrUrl = '';

var Diaspora = {
    L: function(url, f, err) {
        if (url == xhrUrl) {
            return false;
        }
        xhrUrl = url;
        if (xhr) {
            xhr.abort();
        }
        xhr = $.ajax({
            type: 'GET',
            url: url,
            timeout: 10000,
            success: function(data) {
                f(data);
                xhrUrl = '';
            },
            error: function(a, b, c) {
                if (b == 'abort') {
                    err && err()
                } else {
                    window.location.href = url;
                }
                xhrUrl = '';
            }
        });
    },
    loading: function() {
        var w = window.innerWidth;
        var css = '<style class="loaderstyle" id="loaderstyle'+ w +'">'+
            '@-moz-keyframes loader'+ w +'{100%{background-position:'+ w +'px 0}}'+
            '@-webkit-keyframes loader'+ w +'{100%{background-position:'+ w +'px 0}}'+
            '.loader'+ w +'{-webkit-animation:loader'+ w +' 3s linear infinite;-moz-animation:loader'+ w +' 3s linear infinite;}'+
            '</style>';
        $('.loaderstyle').remove()
        $('head').append(css)
        $('#loader').removeClass().addClass('loader'+ w).show()
    },
    loaded: function() {
        $('#loader').removeClass().hide()
    }
};

$(function() {
    $('body').on('click', function(e) {
        var tag = $(e.target).attr('class') || '',
            rel = $(e.target).attr('rel') || '';
        if (!tag && !rel) return;
        switch (true) {
            // next page
            case (tag.indexOf('more') != -1):
                tag = $('.more');
                if (tag.data('status') == 'loading') {
                    return false
                }
                var num = parseInt(tag.data('page')) || 1;
                if (num == 1) {
                    tag.data('page', 1)
                }
                tag.html('加载中...').data('status', 'loading')
                Diaspora.loading()
                Diaspora.L(tag.attr('href'), function(data) {
                    tag.hide();
                    $('.license').hide();
                    var link = $(data).find('.more').attr('href');
                    if (link != undefined) {
                        tag.attr('href', link).html('较旧的文章').data('status', 'loaded')
                        tag.data('page', parseInt(tag.data('page')) + 1)
                    } else {
                        $('body').remove()
                    }
                    var tempScrollTop = $(window).scrollTop();
                    $('body').append($(data).find('.posts'))
                    $(window).scrollTop(tempScrollTop + 100);
                    Diaspora.loaded()
                    $('html,body').animate({ scrollTop: tempScrollTop + 400 }, 500);
                    if (link !== '/') {
                        $('body').append($(data).find('.page-nav'))
                    }
                    $('body').append($(data).find('.license'))
                }, function() {
                    tag.html('较旧的文章').data('status', 'loaded')
                })
                return false;
                break;
            default:
                return true;
                break;
        }
    });
})

