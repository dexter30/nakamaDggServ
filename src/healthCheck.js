"use strict";
var rpcHealthcheck = function (ctx, logger, nk, payload) {
    logger.info('healthcheck rpc called');
    return JSON.stringify({ success: true });
};
