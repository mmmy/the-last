var Promise = require('bluebird')
const http = require('../framework/httpClient');
const notifyPhone = require('./notifyPhone')
const hbsdk = require('../sdk/hbsdk')
const signal = require('./signal')
const winston = require('winston')


const BASE_URL = 'https://api.huobipro.com'
const toCurrency = 'usdt'

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'select-error.log', level: 'error' }),
      new winston.transports.File({ filename: 'select-info.log', level: 'info' }),
      new winston.transports.File({ filename: 'select-all.log' })
    ]
  })


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

const usdtTrades = [
    'btc', 'bch', 'eth', 'etc', 'ltc', 'eos', 'xrp', 'omg', 'dash', 'zec', 'ada',
    'act', 'btm', 'bts', 'ont', 'iost', 'ht', 'trx', 'dta', 'neo', 'qtum', 'ela', 'ven',
    'theta', 'snt', 'zil', 'xem', 'smt', 'nas', 'ruff', 'hsr', 'let', 'mds', 'storj', 'elf',
    'itc', 'cvc', 'gnt'
]

function getKlines(currency, periodNum, size) {
	const toCurrency = 'usdt'
	const symbol = `${currency}${toCurrency}`
	const url = `${BASE_URL}/market/history/kline?symbol=${symbol}&period=${`${periodNum}min`}&size=${size}`
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
    usdtTrades.forEach((currency) => {
        getKlines(currency, 30, 5).then((json) => {
            const klines = json.data
			const selected = signal.select_currency(klines, 15, 1/5)
			// console.log(`----------${currency}`, klines)
			
            if (selected) {
				console.log(`++++${currency}`)
				notifyPhone.notifyPhone(`[${currency}]`)
                logInfo(`${currency}  time: ${notifyPhone.now()}`)
            }
        }).catch(e => {
            console.error('////////////////////////////')
            console.error('getKlines error', e)
            logError('getKlines error'+e)
        })
    })
}

setInterval(() => {
    run()
}, 1000 * 60 * 3)
