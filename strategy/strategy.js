
const moment = require('moment');
const http = require('../framework/httpClient');
const Promise = require('bluebird');
const signal = require('./signal')
const logger = require('./logger')
const acount = require('./acount')

const notifyPhone = require('./notifyPhone')


const BASE_URL = 'https://api.huobipro.com'
const PERIOD = 30

function getFabiBalance(list, currency="usdt") {
	if (!list) {
		return 0
	}
	for (let i=0; i<list.length; i++) {
		var item = list[i]
		if (item.currency === currency) {
			return item.balance
		}
	}
	return 0
}


function getKlines(currency, period, size) {
	const toCurrency = 'usdt'
	const symbol = `${currency}${toCurrency}`
	const url = `${BASE_URL}/market/history/kline?symbol=${symbol}&period=${period}&size=${size}`
	return new Promise((resolve, reject) => {
		http.get(url, {
			timeout: 5000,
			gzip: true
		}).then(data =>{
			let json = JSON.parse(data)
			resolve(json)
		}).catch(ex => {
			reject(ex)
		});
	})
}

function run() {
	const periodNum = PERIOD
	const period = `${periodNum}min`
	const size = 4
	// 获取持仓
	acount.getSymbols().then((balanceList) => {
		// console.log(balanceList)
		balanceList.forEach((balance, i) => {
			if(balance.currency.toLowerCase() === 'usdt') {
				console.log('usdt ................', balance)
				return
			}
			// 获取k线
			getKlines(balance.currency, period, size).then((json) => {
				const klines = json.data
				// 是否卖出
				console.log('currency .................', balance.currency)
				// let sell = signal.safe_category__escape_before_redjump(klines, periodNum)
				let sell = signal.sell_signal_short(klines, periodNum)
				
				console.log('#####################################', i+1)
				console.log(balance, klines && klines[0])
				
				if (sell) {
					// acount.batchcancelCurrency
					let amount = parseFloat(balance.balance)
					amount = Math.floor(amount * 10000) / 10000 - 1.2  // 需要精确到4位, eth,btc 四位
					amount = amount.toFixed(4)
					console.log(`~~~~~~~~~oooooooo~~~~~~~~~ amount :${amount}`)
					acount.sellCurrency(balance.currency, amount).then(() => {
						notifyPhone.notifyPhone(`sold ${balance.currency} ${amount}`, 'cosmic')
						logger.logInfo(`sold: ${JSON.stringify(balance)}, amount: ${amount}`)
					}).catch(e => logger.logError(e))
				}

				let buy = signal.buy_signal_short(klines, periodNum)
				let buyCurrency = balance.currency
				if (buy) {
					console.log('start buy ++++++++++++++++++++++++++++++++++++++++++++', i+1)
					const amount = Math.floor(getFabiBalance(balanceList, 'usdt'))
					acount.buyCurrency(buyCurrency, amount).then(() => {
						notifyPhone.notifyPhone(`buy ${balance.currency} ${amount}`, 'bike')
						logger.logInfo(`buy: ${JSON.stringify(balance)}, amount: ${amount}`)
					}).catch(e => logger.logError(e))
				}
			}).catch((e) => {
				logger.logError(e)
			})
		})
	}).catch((e) => {
		logger.logError(e)
	})
	// getKlines('eosusdt', period, size).then((json) => {
	// 	const klines = json.data
	// 	const sell = signal.safe_category__escape_before_redjump(klines, 60)
	// 	console.log('should sell: ' , sell)
	// 	if (sell) {
	// 		// 卖出信号
	// 		logger.logInfo(`sell at: ${JSON.stringify(klines[0])}`)
	// 	}
	// 	// logger.logInfo(json)
	// }).catch((e)=>{
	// 	logger.logError(e)
	// })
}
setInterval(()=>{
	run()
}, 1000 * 60 * PERIOD / 20)

