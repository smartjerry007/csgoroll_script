
// ==UserScript==
// @name         WS WITHDRAW SNIPER V4 GIT
// @namespace
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.csgoroll.com/en/withdraw/csgo/p2p
// @icon         https://www.google.com/s2/favicons?sz=64&domain=csgoroll.com
// 
// ==/UserScript==
let socket, ping;
const blue = '\x1b[36m%s\x1b[0m';
const config = {
    MaxMarkUp: 3, // Max markup percent
    MinPrice: 700, // Min price in coins
    MaxPrice: 10000, // Max price in coins
};
const DateFormater = () => "[" + new Date().toLocaleString("en-US", {
    hour12: false,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
}) + ":" + new Date().getMilliseconds() + "]";
function connectWebSocket() {
    socket = new WebSocket("wss://api.csgoroll.com/graphql", "graphql-transport-ws");
    socket.onopen = function () {
        console.log(blue, `${DateFormater()} | WebSocket connected`);
        socket.send(JSON.stringify({"type": "ping", "payload": {}}));
        socket.send(JSON.stringify({"type": "connection_init"}));
        ping = setInterval(function () {
            sendPing();
        }, 60000);
    };
    socket.onmessage = function (event) {
        if (event.data === '{"type":"connection_ack"}') {
            console.log(blue, `${DateFormater()} | WebSocket connection acknowledged`);
            socket.send(JSON.stringify(createTradePayload));
        }
        let data = JSON.parse(event.data);
        const {createTrade} = data?.payload?.data || {};
        if (createTrade) {
            const {trade} = createTrade;
            if (trade && trade.tradeItems) {
                for (const item of trade.tradeItems) {
                    if (item.markupPercent <= config.MaxMarkUp &&
                        item.value >= config.MinPrice &&
                        item.value <= config.MaxPrice
                    ) {
                        socket.send(JSON.stringify({
                            "id": uuidv4(),
                            "type": "subscribe",
                            "payload": {
                                "variables": {
                                    "input": {
                                        "tradeIds": [trade.id],
                                        "recaptcha": " ",
                                    }
                                },
                                "extensions": {},
                                "operationName": "JoinTrades",
                                "query": "mutation JoinTrades($input: JoinTradesInput!) {\n  joinTrades(input: $input) {\n    trades {\n      id\n      status\n      totalValue\n      updatedAt\n      expiresAt\n      withdrawer {\n        id\n        steamId\n        avatar\n        displayName\n        steamDisplayName\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
                            }
                        }));
                        console.log(blue, `${DateFormater()} | Name: ${item.marketName} \n\t\t\t\t\t Percentage: ${item.markupPercent}% \n\t\t\t\t\t`);
                    }
                }
            }
        }
    };
    socket.onerror = function (error) {
        console.error(blue, `${DateFormater()} | WebSocket error: ${error}`);
        clearInterval(ping);
        setTimeout(() => {
            connectWebSocket();
        }, 2000);
    }
    socket.onclose = function (event) {
        console.log(blue, `${DateFormater()} | WebSocket closed: ${event.code} ${event.reason}`);
        clearInterval(ping);
        setTimeout(() => {
            connectWebSocket();
        }, 2000);
    }
}
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function sendPing() {
    socket.send(JSON.stringify({"type": "ping"}));
    console.log(blue, `${DateFormater()} | Ping Sent`);
}
const createTradePayload = {
    "id": uuidv4(),
    "type": "subscribe",
    "payload": {
        "variables": {
            "channel": "en"
        },
        "extensions": {},
        "operationName": "OnCreateTrade",
        "query": "subscription OnCreateTrade($userId: ID) {\n  createTrade(userId: $userId) {\n    trade {\n      ...Trade\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment Trade on Trade {\n  id\n  status\n  steamAppName\n  cancelReason\n  canJoinAfter\n  markupPercent\n  createdAt\n  depositor {\n    id\n    steamId\n    avatar\n    displayName\n    steamDisplayName\n    __typename\n  }\n  promoCode {\n    id\n    percentageReward\n    maxBalance\n    __typename\n  }\n  expiresAt\n  withdrawerSteamTradeUrl\n  customValue\n  withdrawer {\n    id\n    steamId\n    avatar\n    displayName\n    steamDisplayName\n    __typename\n  }\n  totalValue\n  updatedAt\n  tradeItems {\n    id\n    marketName\n    value\n    customValue\n    itemVariant {\n      ...ItemVariant\n      __typename\n    }\n    markupPercent\n    __typename\n  }\n  trackingType\n  suspectedTraderCanJoinAfter\n  joinedAt\n  __typename\n}\n\nfragment ItemVariant on ItemVariant {\n  id\n  itemId\n  name\n  brand\n  iconUrl\n  value\n  currency\n  displayValue\n  exchangeRate\n  shippingCost\n  usable\n  obtainable\n  withdrawable\n  depositable\n  externalId\n  type\n  category {\n    id\n    name\n    __typename\n  }\n  color\n  size\n  rarity\n  availableAssets {\n    steamAssetId\n    availableAt\n    __typename\n  }\n  purchasable\n  totalRequested\n  totalAvailable\n  totalFulfilled\n  totalUnfulfilled\n  createdAt\n  __typename\n}\n"
    }
};
console.log(blue, `${DateFormater()} | START WEBSOCKET SCRIPT`);
connectWebSocket();



