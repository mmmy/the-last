
/*
Kline: {
	id,      // id * 1000 得到当前unix时间
	open,
	close,
	low,
	high,
	vol,
	amount,
	count
}
 */

var UTILS = {
	// 数据校验, 数据不合格，不应该往下做策略，并发出警告
	assertKline: function(Kline) {
		return true
	},
	// 计算收益率
	getEarnRate: function(Kline){
		return (Kline.close - Kline.open) / Kline.open
	},
	// 将当前的K线数据简单按时间比例归一化处理(线性预测收盘价和交易量)
	// efficientRate建议在经过一个交易周期的1/3后, 才调用此方法,
	// 时间越短越没有参考价值, 信号的准确率越低, 但是时间越长，做出决定已经太迟
	// 这是个博弈，有得也有失
	normalizeKlineWidthPeriod: function(Kline, periodMins, efficientRate, now) {
		efficientRate = efficientRate || 0.333333333
		now = now || new Date() / 1000
		var periodSeconds = periodMins * 60
		var openDate = Kline.id
		var timeHasPassed = now - openDate
		// 底线是3分钟
		if (timeHasPassed < 1 * 60) {
			return false
		}

		var currentRate = timeHasPassed / periodSeconds
		// 进度最大是100%
		currentRate = Math.min(currentRate, 1)
		// 如果时间不够长，不发出任何信号
		if (currentRate < efficientRate) {
            // console.log('currentRate is not enough:' + currentRate.toFixed(3))
			return false
		}

		var targetRate = 1 / currentRate
		var open = Kline.open,
				close = Kline.close,
				low = Kline.low,
				high = Kline.high,
				vol = Kline.vol
		var changesPrediction = (close - open) * targetRate
		var closePrediction = open + changesPrediction
		var klinePredict = {
			...Kline,
			close: closePrediction,
			low: Math.min(low, closePrediction),
			high: Math.max(high, closePrediction),
			vol: Kline.vol * targetRate,
		}
		// console.log(Kline, klinePredict)
		return klinePredict
	}
}

// 逃跑计划
// 此策略可能会有错误的判断，导致提前出局（比如V字形反转），但是这个策略是安全的
// 你永远不能预测未来的走势，我们只有概率
function safe_category__escape_before_redjump(latestKlines, periodMins, efficientRate) {
	efficientRate = efficientRate || 1/3
	var K0 = latestKlines[0]
	var K1 = latestKlines[1]
	var K2 = latestKlines[2]
	var K3 = latestKlines[3]
	var K0Prediction = UTILS.normalizeKlineWidthPeriod(K0, periodMins, efficientRate)

	var earnRate0 = UTILS.getEarnRate(K0)
	var earnRate1 = UTILS.getEarnRate(K1)
	var earnRate2 = UTILS.getEarnRate(K2)
	var volumeRate = K0.vol / K1.vol

	// 下跌， 加速1.5倍下跌， 交易量放大两倍以上
	var c1 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 1.5 && volumeRate > 2

	var c2 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 3 && volumeRate > 1.5

	var c3 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 4 && volumeRate > 1.2

	var c4 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 4.6 && volumeRate > 1.05

	return c1 || c2 || c3 || c4 ? 1 : 0
}

function safe_category__escape_before_redjump_eth(latestKlines, periodMins, efficientRate) {
	efficientRate = efficientRate || 1/3
	var K0 = latestKlines[0]
	var K1 = latestKlines[1]
	var K2 = latestKlines[2]
	var K3 = latestKlines[3]
	var K0Prediction = UTILS.normalizeKlineWidthPeriod(K0, periodMins, efficientRate)

	var earnRate0 = UTILS.getEarnRate(K0)
	var earnRate1 = UTILS.getEarnRate(K1)
	var earnRate2 = UTILS.getEarnRate(K2)
	var volumeRate = K0.vol / K1.vol

	// 下跌， 加速1.5倍下跌， 交易量放大两倍以上
	var c1 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 1.5 && volumeRate > 2

	var c2 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 3 && volumeRate > 1.5

	var c3 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 4 && volumeRate > 1.2

	var c4 = earnRate0 < 0 && Math.abs(earnRate0 / earnRate1) > 4.6 && volumeRate > 1.05

	var c5 = earnRate0 < -0.018  //一个小时下跌了1.8% 经验值

	return (c1 || c2 || c3 || c4) && c5 ? 1 : 0
}

exports.safe_category__escape_before_redjump = safe_category__escape_before_redjump
exports.safe_category__escape_before_redjump_eth = safe_category__escape_before_redjump_eth
