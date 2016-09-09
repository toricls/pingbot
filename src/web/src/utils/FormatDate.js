export default function (date, format = 'YYYY-MM-DD hh:mm:ss.SSS') {
    if (!format) format = 'YYYY-MM-DD hh:mm:ss.SSS'
    format = format.replace(/YYYY/g, date.getFullYear())
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2))
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2))
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2))
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2))
    if (format.match(/S/g)) {
        var milliSeconds = ('00' + date.getMilliseconds()).slice(-3)
        var length = format.match(/S/g).length
        for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1))
    }
    return format
}
