var Promise = require('bluebird');

const hbsdk = require('../sdk/hbsdk');

const toCurrency = 'usdt'
// hbsdk.get_balance().then(console.log);
// hbsdk.get_open_orders('eosusdt').then(console.log);
exports.getSymbols = function() {
    return new Promise((resolve, reject) => {
        hbsdk.get_balance().then((json) => {
            // list: [{currency, type, balance}]
            // 选出有持仓的 个数大于或等于0.0001的
            if (!json) {
                console.log('?????????????????????????????????')
                console.log(json)
                console.log('?????????????????????????????????')
                reject('getSymbols empty')
            } else {
                // 选出持币数量大于0.01个
                let symbols = json.list.filter(item => Math.floor(parseFloat(item.balance) * 100) > 0)
                // symbols = symbols.filter(item => item.currency.toLowerCase() !== 'usdt')
                // symbols = symbols.filter(item => ['eos'].indexOf(item.currency.toLowerCase()) === -1) // 先不能拿eos 做实验
                symbols = symbols.filter(item => item.type === 'trade')            // 过滤能交易的, 因为还有frozen
                resolve(symbols)
            }

        }).catch(reject)
    })
}
// 取消api挂单
exports.batchcancelCurrency = function(currency) {
    const symbol = `${currency}${toCurrency}`
    return new Promise((resolve, reject) => {
        hbsdk.get_open_orders(symbol).then((list) => {
            // source: spot-api, spot-app
            list = list.filter(item => item.source === 'spot-api')
            const oriderIds = list.map(item => item.id)
            // 首先取消api挂卖的订单
            if (oriderIds.length > 0) {
                hbsdk.batchcancel(oriderIds).then(() => {
                    // 全部挂单卖出
                    resolve()
                }).catch(reject)
            } else {
                resolve()
            }
        }).catch(reject)
    })
}
// sell
exports.sellCurrency = function(currency, amount) {
    const symbol = `${currency}${toCurrency}`
    return hbsdk.sell_market(symbol, amount)
}
// buy
exports.buyCurrency = function(currency, amount) {
    const symbol = `${currency}${toCurrency}`
    return hbsdk.buy_market(symbol, amount)
}
