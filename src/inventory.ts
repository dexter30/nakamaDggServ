const InvPermissionRead = 1;
const InvPermissionWrite = 0;
const InvCollectionName = 'item_collection';
const InvCollectionKey = 'user_items';

const DefaultInventoryList = [
    {
        idIndex: 0,
        name: "Basic fist"
    },
    {
        idIndex: 1,
        name: "Gnomes GreatSword"
    },
    {
        idIndex: 2,
        name: "Ahrelevant Sledge"
    },
    {
        idIndex: 3,
        name: "Weebgands Katana"
    },
    {
        idIndex: 4,
        name: "Georges Staff"
    },
    {
        idIndex: 5,
        name: "Kitty Claw of Dan"
    }
]

const DefaultStoredInv = [
    {
        idIndex: 0,
        name: "Basic fist"
    }
]


type invMap = {[id: string]: itemSlot}

interface itemSlot {
    idIndex: number
    name: string
}

interface inventory {
    invListing: invMap
    invStore: invMap
}


interface removeItemRequest {
    idIndex: number
}

// const rpcResetInventory: nkruntime.RpcFunction = 
//     function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string ){
//         let collection = defaultInvCollection(nk, logger, ctx.userId);
//     }

function defaultInvCollection(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string): inventory {
    let invFull: any = {};
    DefaultInventoryList.forEach(c => {
        invFull[nk.uuidv4()] = c;
    });

    let stored: any = {};
    DefaultStoredInv.forEach(c => {
        stored[nk.uuidv4()] = c;
    })

    let cards: inventory = {
        invListing: invFull,
        invStore: stored,
    }

    storeUserItems(nk, logger, userId, cards);

    return {
        invListing: invFull,
        invStore: stored,
    }
}

function storeUserItems(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, cards: inventory) {
    try {
        nk.storageWrite([
            {
                key: InvCollectionKey,
                collection: InvCollectionName,
                userId: userId,
                value: cards,
                permissionRead: InvPermissionRead,
                permissionWrite: InvPermissionWrite,
            }
        ]);
    } catch(error) {
        if (error instanceof Error) {
        logger.error('storageWrite error: %s', error.message);
        }
        throw error;
    }
}

function loadUserItems(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string): inventory {
    let storageReadReq: nkruntime.StorageReadRequest = {
        key: InvCollectionKey,
        collection: InvCollectionName,
        userId: userId,
    }

    let objects: nkruntime.StorageObject[];
    try {
        objects = nk.storageRead([storageReadReq]);
    } catch(error) {
        if (error instanceof Error) {
        logger.error('storageRead error: %s', error.message);
        }
        throw error;
    }

    if (objects.length === 0) {
        return defaultInvCollection(nk,logger,userId) as inventory
        //throw Error('user cards storage object not found');
    }

    let storedCardCollection = objects[0].value as inventory;
    return storedCardCollection;
}

const rpcLoadUserItems: nkruntime.RpcFunction =
        function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) : string {
    return JSON.stringify(loadUserItems(nk, logger, ctx.userId));
}

const rpcResetItemCollection: nkruntime.RpcFunction =
        function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
    let collection = defaultInvCollection(nk, logger, ctx.userId);
    storeUserItems(nk, logger, ctx.userId, collection);

    logger.debug('user %s card collection has been reset', ctx.userId);
    return JSON.stringify(collection);
}

const rpcGetRandomItem: nkruntime.RpcFunction =
        function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
    let idIndex = Math.floor(Math.random() * 5) + 1 as number;
    let desc = DefaultInventoryList[idIndex].name;
            
    let userInv: inventory;
    try {
        userInv = loadUserItems(nk, logger, ctx.userId);
    } catch (error) {
        if (error instanceof Error) {
        logger.error('error loading user cards: %s', error.message);
        }
        throw Error('Internal server error');
    }


    let existingItem: itemSlot | undefined;
    for (const key in userInv.invStore) {
        if (userInv.invStore.hasOwnProperty(key)) {
            const item = userInv.invStore[key];
            if (item.idIndex === idIndex) {
                existingItem = item;
                break;
            }
        }
    }

    if (existingItem) {
        logger.debug('user %s already has an item with idIndex %d', ctx.userId, idIndex);
        return JSON.stringify({ message: 'You already have an item with this idIndex.' });
    }

    let cardId = nk.uuidv4();
    let newCard: itemSlot = {
        idIndex,
        name: desc
    }

    userInv.invStore[cardId] = newCard;


        // Store the new card to the collection.
    storeUserItems(nk, logger, ctx.userId, userInv);


    logger.debug('user %s successfully got a new item', ctx.userId);

    return JSON.stringify({[cardId]: newCard});
}

const rpcRemoveItem: nkruntime.RpcFunction =
        function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
        let remove: removeItemRequest = JSON.parse(payload);
        let userInvs = loadUserItems(nk, logger, ctx.userId);

        if (!userInvs) {
            logger.error('user %s item collection not found', ctx.userId);
            throw Error('Internal server error');
        }

        delete userInvs.invStore[remove.idIndex]

        try {
            storeUserItems(nk, logger, ctx.userId, userInvs);
        } catch(error) {
            // Error logged in storeUserCards
            throw Error('Internal server error');
        }
        return JSON.stringify("success");
} 
        