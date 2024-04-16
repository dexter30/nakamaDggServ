let rpcRedeemCheck: nkruntime.RpcFunction =
 function  (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string){
    logger.info('redeemCheck rpc called');
    return JSON.stringify({success: true});
}