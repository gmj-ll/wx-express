var request = require('request');
var crypto = require('crypto');
var fs = require('fs')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
var { subscribeMsg, firstBindMsg, otherBindMsg } = require('../static')

function WeChat(config) {
  this.config = config
  this.accessToken = null
  this.getAccessTokenTimer = null
}

WeChat.prototype.Authenticate = function (req, res) {
  //1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
  var signature = req.query.signature,//微信加密签名
    timestamp = req.query.timestamp,//时间戳
    nonce = req.query.nonce,//随机数
    echostr = req.query.echostr;//随机字符串

  //2.将token、timestamp、nonce三个参数进行字典序排序
  var array = [this.config.token, timestamp, nonce];
  array.sort();

  //3.将三个参数字符串拼接成一个字符串进行sha1加密
  var tempStr = array.join('');
  const hashCode = crypto.createHash('sha1'); //创建加密类型 
  var resultCode = hashCode.update(tempStr, 'utf8').digest('hex'); //对传入的字符串进行加密

  //4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
  if (resultCode === signature) {
    res.send(echostr);
  } else {
    res.send('mismatch');
  }
}

WeChat.prototype.GetAccessToken = function () {
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/token',
    qs: {
      grant_type: 'client_credential',
      appid: this.config.App_Id,
      secret: this.config.App_Secret
    },
    method: 'GET',
    headers: {
      "content-type": "application/json"
    }
  }
  return new Promise((resolve, reject) => {
    request(option, function (error, response, body) {
      var data = JSON.parse(body)
      if (error) {
        reject(error)
      } else {
            self.accessToken = {
              access_token: data.access_token,
              expires_in: data.expires_in
            }
            console.log('当前access_token', JSON.stringify(self.accessToken))
            // 定时重新获取access_token
            clearTimeout(this.getAccessTokenTimer)
            this.getAccessTokenTimer = setTimeout(() => {
              self.GetAccessToken()
            }, (data.expires_in - 60) * 1000 || 60000)
            resolve(data)
      }
    })
  })
}

WeChat.prototype.GetMedia = function (id) {
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/media/get',
    qs: {
      access_token: self.accessToken.access_token,
      media_id: id
    },
    method: 'GET',
    headers: {
      "content-type": "application/json"
    }
  }
  return new Promise((resolve, reject) => {
    const time = new Date().getTime()
    const writerStream = fs.createWriteStream('./wav/temp' + time + '.amr')
    request(option, function (error, response, body) {
    }).pipe(writerStream)
    writerStream.on('finish', () => {
      ffmpeg(fs.createReadStream('./wav/temp' + time + '.amr')).save('./wav/temp' + time + '.wav').on('error', err => {
        console.log(err.message)
      }).on('end', () => {
        resolve('temp' + time + '.wav')
      })
    })
  })

}

WeChat.prototype.GetVideoMedia = function (id) {
  console.log(id)
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/material/get_material',
    qs: {
      access_token: self.accessToken.access_token
    },
    body: JSON.stringify({
      "media_id": id
    }),
    json: true,
    method: 'POST',
    headers: {
      "content-type": "application/json",
      'Accept': 'application/json'
    }
  }
  return new Promise((resolve, reject) => {
    request(option, function (error, response, body) {
      if (error) {
        console.log(error)
        reject(error)
      }
      console.log('媒体返回')
      console.log(body);
      resolve(body)
    })
  })
  

}

WeChat.prototype.postMedia = function () {
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
    qs: {
      access_token: self.accessToken.access_token,
      type: 'video',
    },
    formData: {
      description: JSON.stringify({"title":"zsy1", "introduction":"happy birthday"}),
      media: fs.createReadStream('./media/zsy1.mp4')
    },
    method: 'POST',
    headers: {
      "content-type": "application/json"
    }
  }
  request(option, function (error, response, body) {
    console.log('返回: ' + body);
  })
}

WeChat.prototype.subscribe = function (data, res) {
  const { FromUserName, ToUserName } = data
  let content = subscribeMsg
  if (global.isFindMaster) {
    content = content + '\n' + otherBindMsg
  } else {
    content = content + '\n' + firstBindMsg
  }
  res.send(`<xml>
  <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
  <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
  <CreateTime>${Date.now()}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${content}]]></Content>
  </xml>`)
}


module.exports.WeChat = WeChat;
