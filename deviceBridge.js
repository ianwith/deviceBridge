(function(){
    var isAndroid = /Android/.test(navigator.userAgent);
    var callbackMethodName = null;
    var debug_mode = !(/cm_na/.test(navigator.userAgent));
    /**
     * 与NA约定的Action名称
     */
    var cmdMap = {
        loadDone: "LOAD_DONE",
        causeReply: "REPLY",
        replyStatus: "REPLY_RESULT",
        sendComment: "SEND",
        showImg: "SHOW_IMAGE",
        showAttachment: "SHOW_ATTACHMENT"
    };
    /**
     * 接口池
     */
    var cmdPool = {
        "deviceBridge.device.loadDone": function (action) {
            doRequest(action);
        },
        "deviceBridge.device.causeReply": function (action, params) {
            doRequest(action, params, deviceBridge.call.sendComment);
        },
        "deviceBridge.call.sendComment": function (action, params) {
            var args = JSON.parse(params);
            if (!args.actionID) {
                // 如果是NA直接触发回复
                args.actionID = getReqID();
            }
            try {
                window['send_reply'](args); // request server api
            } catch(e) {}
        },
        "deviceBridge.result.replyStatus": function (action, params) {
            doRequest(action, params);
        },
        "deviceBridge.device.showImg": function (action, params) {
            doRequest(action, params);
        },
        "deviceBridge.device.showAttachment": function (action, params) {
            doRequest(action, params);
        }
    };
    function getReqID () {
        return '_bd_' + new Date().getTime();
    }
    function initCallback (callback, nReqID) {
        callbackMethodName = 'callbackjs' + nReqID;
        window[callbackMethodName] = function(res){
            window[callbackMethodName] = null;
            callback(res);
        }
    }
    function sendRequest (action, nReqID, args, callbackMethodName) {
        var reqData = {
            action: action,
            actionID: nReqID,
            args: args
        };
        if (!debug_mode) {
            if (isAndroid) {
                if (callbackMethodName != null) {
                    prompt(JSON.stringify(reqData), "javascript:" + callbackMethodName + "('%1$s')");
                }
                else {
                    prompt(JSON.stringify(reqData));
                }
            }
            else {
                if (callbackMethodName != null) {
                    reqData.callback = callbackMethodName;
                }
                window.location = "chunmiao://#/" + JSON.stringify(reqData);
            }
        }
        else {
            alert(JSON.stringify(reqData));
            if (callbackMethodName != null) {
                var data = {
                    data: "content",
                    actionID: reqData.actionID
                }
                window[callbackMethodName](JSON.stringify(data));
            }
        }
    }
    function doRequest (action, args, callback) {
        var nReqID = getReqID();
        if (callback) {
            initCallback(callback, nReqID);
            sendRequest(action, nReqID, args, callbackMethodName);
        }
        else {
            sendRequest(action, nReqID, args);
        }
    }
    /**
     * 注册命名空间
     */
    function ns (namespace, owner) {
        var names = namespace.split(".");
        owner = owner || window;
        for (var i = 0; i < names.length; i++) {
            var packageName = names[i];
            owner[packageName] = owner[packageName] || {};
            owner = owner[packageName];
        }
        return owner;
    }
    /**
     * 固化参数Action名
     */
    function currying (fn, cmd) {
        return function () {
            var args = [cmd];
            args.push.apply(args, arguments);
            return fn.apply(this, args);
        }
    }
    /**
     * 生成方法
     */
    function bindFn (cmdStr, fn) {
        var parts = cmdStr.split(".");
        var method = parts.pop();
        var prefix = parts.join(".");
        var namespace = ns(prefix);
        namespace[method] = currying(fn, cmdMap[method]);
    }
    /**
     * 构建接口
     */
    function buildInterface () {
        for (var key in cmdPool) {
            bindFn(key, cmdPool[key]);
        }
    }
    /**
     * 构建调试接口
     */
    function buildDebugInterface () {
        deviceBridge.setBebugMode = function (mode) {
            debug_mode = !!mode;
        }
    }

    buildDebugInterface();
    buildInterface();
})();