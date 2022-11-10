var { checkVoice } = require('./usePy')

var { errorMsgs, successMsgs, medias, bindSucessMsg, bindFailMsg } = require('../static')

module.exports = {
  check(user_data, wechat, res) {
    console.log('into check')
    let errorMsg = errorMsgs[Math.floor((Math.random()*errorMsgs.length))]
    let successMsg = successMsgs[Math.floor(Math.random() * successMsgs.length)]
    const { FromUserName, ToUserName } = user_data
    let resPromise = global.reqMsgIds[user_data.MsgId]
    if (!resPromise) {
      const promise = wechat.GetMedia(user_data.MediaId).then(fileName => {
        return checkVoice(fileName, 1).then(name => {
          global.openIdStatus[FromUserName] = true
          let replyMessage = `<xml>
              <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
              <CreateTime>${Date.now()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${successMsg}]]></Content>
              </xml>`
          res.send(replyMessage)
          return name
        }).catch(e => {
          if (e == '识别错误') {
            let replyMessage = `<xml>
                <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
                <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
                <CreateTime>${Date.now()}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${errorMsg}]]></Content>
                </xml>`
            res.send(replyMessage)
          }
          return Promise.reject(e)
        }).finally(() => {
          delete global.reqMsgIds[user_data.MsgId]
        })
      })
      global.reqMsgIds[user_data.MsgId] = promise
    } else {
      global.reqMsgIds[user_data.MsgId] = resPromise.then(name => {
        global.openIdStatus[FromUserName] = true
        let replyMessage = `<xml>
              <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
              <CreateTime>${Date.now()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${successMsg}]]></Content>
              </xml>`
        res.send(replyMessage)
        return name
      }).catch(e => {
        if (e == '识别错误') {
          let replyMessage = `<xml>
              <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
              <CreateTime>${Date.now()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${errorMsg}]]></Content>
              </xml>`
          res.send(replyMessage)
        }
        return e
      }).finally(() => {
        delete global.reqMsgIds[user_data.MsgId]
      })
    }
  },
  bind(user_data, wechat, res) {
    console.log('into bind')
    const { FromUserName, ToUserName } = user_data
    let resPromise = global.reqMsgIds[user_data.MsgId]
    if (!resPromise) {
      const promise = wechat.GetMedia(user_data.MediaId).then(fileName => {
        return checkVoice(fileName, 0, FromUserName).then(() => {
          let replyMessage = `<xml>
              <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
              <CreateTime>${Date.now()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${bindSucessMsg}]]></Content>
              </xml>`
          global.isFindMaster = true
          res.send(replyMessage)
        }).catch(e => {
          let replyMessage = `<xml>
              <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
              <CreateTime>${Date.now()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${bindFailMsg}]]></Content>
              </xml>`
          res.send(replyMessage)
        }).finally(() => {
          delete global.reqMsgIds[user_data.MsgId]
        })
      })
      global.reqMsgIds[user_data.MsgId] = promise
    } else {
      global.reqMsgIds[user_data.MsgId] = resPromise.then(name => {
        global.openIdStatus[FromUserName] = true
        let replyMessage = `<xml>
              <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
              <CreateTime>${Date.now()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${bindSucessMsg}]]></Content>
              </xml>`
        global.isFindMaster = true
        res.send(replyMessage)
        return name
      }).catch(e => {
          let replyMessage = `<xml>
              <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
              <CreateTime>${Date.now()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${bindFailMsg}]]></Content>
              </xml>`
          res.send(replyMessage)
        return e
      }).finally(() => {
        delete global.reqMsgIds[user_data.MsgId]
      })
    }

  }
}