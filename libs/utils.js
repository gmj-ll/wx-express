const {parseString} = require("xml2js")

module.exports = {
    getUserDataAsync(req) {
        // 流式文件内容获取
        return new Promise((resolve, reject) => {
            let data = ""
            // 拼接流式文件的数据
            req.on("data", userData => {
                // 因为是二进制数据我们需要转化一下
                data += userData.toString()
            })

            req.on("end", () => {
                // 数据获取完毕
                resolve(data)
            })
        })
    },
    parseXmlData(xmlData) {
        // 解析xml为js对象
        return new Promise((resolve, reject) => {
            parseString(xmlData, { trim: true }, (err, data) => {
                if (!err) {
                    resolve(data)
                } else {
                    reject(err)
                }
            })
        })
    },
    formatMsg(data) {
        const result = {}
        const xmlOjb = data.xml
        if (typeof xmlOjb === "object") {
            for (_key in xmlOjb) {
                const _value = xmlOjb[_key]
                // MsgId: [ '23683987267420534' ]
                if (Array.isArray(_value) && _value.length > 0) {
                    result[_key] = _value[0]
                }
            }
        }

        return result
    }

}
