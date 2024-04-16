"use strict";
var InitModule = function (ctx, logger, nk, initializer) {
    initializer.registerRpc("healthCheck", rpcHealthcheck);
    logger.info("Hello World!");
};
