const winston = require('winston')
const notifyPhone = require('./notifyPhone')

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

exports.logInfo = function(msg) {
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	
	console.log(msg)
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	console.log('++++++++++++++++++++++++++++++++++++')
	
  var now = notifyPhone.now()
	logger.log({
		level: 'info',
		time: +now,
		msg: msg,
	})
}
exports.logError = function(msg) {
	console.error('================================')
	console.log(msg)
	logger.log({
		level: 'error',
		time: notifyPhone.now(),
		msg: msg,
	})
}
