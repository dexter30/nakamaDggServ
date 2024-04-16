let InitModule: nkruntime.InitModule =
        function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerRpc("healthCheck",rpcHealthcheck);
    initializer.registerRpc("load_user_items", rpcLoadUserItems);
    initializer.registerRpc("reset_user_inventory",rpcResetItemCollection);
    initializer.registerRpc("add_Item", rpcGetRandomItem);
    initializer.registerRpc("remove_Item", rpcRemoveItem);
    logger.info("Hello World!");
}
