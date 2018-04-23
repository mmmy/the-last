
const moment = require('moment');
const http = require('../framework/httpClient');
const Promise = require('bluebird');
const winston = require('winston')
const signal = require('./signal')

const acount = require('./acount')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'info.log', level: 'info' }),
    new winston.transports.File({ filename: 'all.log' })
  ]
})


const BASE_URL = 'https://api.huobipro.com'
const PERIOD = 60

function logInfo(msg) {
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	
	console.log(msg)
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	
  var now = new Date()
	logger.log({
		level: 'info',
		time: +now,
		msg: msg,
	})
}
function logError(msg) {
	console.error('================================')
	console.log(msg)
	logger.log({
		level: 'error',
		time: +new Date(),
		msg: msg,
	})
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
			// 获取k线
			getKlines(balance.currency, period, size).then((json) => {
				const klines = json.data
				// 是否卖出
				const sell = signal.safe_category__escape_before_redjump(klines, periodNum)
				// console.log('#####################################', i+1)
				// console.log(balance)
				
				if (sell) {
					// acount.batchcancelCurrency
					let amount = parseFloat(balance.balance)
					amount = Math.floor(amount * 10000) / 10000  // 需要精确到4位
					acount.sellCurrency(balance.currency, amount).then(() => {
						logInfo(`sold: ${JSON.stringify(balance)}`)
					}).catch(e => logError(e))
				}
			}).catch((e) => {
				logError(e)
			})
		})
	}).catch((e) => {
		logError(e)
	})
	// getKlines('eosusdt', period, size).then((json) => {
	// 	const klines = json.data
	// 	const sell = signal.safe_category__escape_before_redjump(klines, 60)
	// 	console.log('should sell: ' , sell)
	// 	if (sell) {
	// 		// 卖出信号
	// 		logInfo(`sell at: ${JSON.stringify(klines[0])}`)
	// 	}
	// 	// logInfo(json)
	// }).catch((e)=>{
	// 	logError(e)
	// })
}
setInterval(()=>{
	run()
}, 1000 * 60 * PERIOD / 20)

