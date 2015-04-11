/*
* @file: tap监听
* @author: mingquan
参数说明
options:
{
    'container': $dom,
    'prefix-fun': 'data-fun',
    'bind':{
        'fun1': function(){
            //do
        },
        'fun2': function(){
            //do
        }
    }
}
*/
function TapEvents (options) {
    if (!Hammer) { 
        return;
    }
    if (!options.container.length) {
        return;
    }

    this.preventDefault = true;

    $.extend(this, options);

    this['prefix-fun'] = this['prefix-fun'] || 'data-fun';

    this.init();
}

TapEvents.prototype = {
    init: function () {
        var me = this;

        Hammer($(this.container)[0]).on('tap', function (e) {
            if (me.preventDefault) {
                e.gesture.preventDefault();
            }
            var target = $(e.target);
            var fun = target.attr('data-fun');
            for (var i in me.bind) {
                if (fun === i) {
                    me.bind[i](target);
                    break;
                }
            }
        });
    }
};
