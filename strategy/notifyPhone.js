var exec = require('child_process').exec
const moment = require('moment-timezone')

const now = function() {
    return moment().tz('Asia/ShangHai').format('MM-DD hh:mm:ss')
}

exports.notifyPhone = function(msg, sound) {
    msg = `${now()}  ${msg}`
    sound = sound || 'pushover'
    exec(`curl -s \
        --form-string "token=aiee6nmcgz678kbouuoujsmf4wko96" \
        --form-string "user=gdz6nj653847v5e65px71bcstdsicv" \
        --form-string "sound=${sound}" \
        --form-string "message=${msg}" \
        https://api.pushover.net/1/messages.json`)
}

exports.now = now