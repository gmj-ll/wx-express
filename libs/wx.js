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

WeChat.prototype.GetImageMediaList = function () {
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',
    qs: {
      access_token: self.accessToken.access_token
    },
    body: {
      "type": "image",
      "offset": 0,
      "count": 20
    },
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
      console.log('图片返回')
      console.log(body.item)
      resolve(body.item)
    })
  })
  

}

WeChat.prototype.GetVideoList = function () {
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',
    qs: {
      access_token: self.accessToken.access_token
    },
    body: {
      "type": "video",
      "offset": 0,
      "count": 20
    },
    json: true,
    method: 'POST',
    headers: {
      "content-type": "application/json"
    }
  }
  return new Promise((resolve, reject) => {
    request(option, function (error, response, body) {
      if (error) {
        console.log(error)
        reject(error)
      }
      console.log('视频返回')
      console.log(body)
      resolve(body.item)
    })
  })
  

}

WeChat.prototype.GetVoiceMediaList = function () {
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',
    qs: {
      access_token: self.accessToken.access_token
    },
    body: {
      "type": "voice",
      "offset": 0,
      "count": 20
    },
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
      console.log('语音返回')
      resolve(body.item)
    })
  })
  

}

WeChat.prototype.GetNewsMediaList = function () {
  var self = this
  let option = {
    url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',
    qs: {
      access_token: self.accessToken.access_token
    },
    body: {
      "type": "news",
      "offset": 0,
      "count": 20
    },
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
      console.log('图文返回')
      console.log(body.item)
      resolve(body.item)
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

WeChat.prototype.sendVideoMedia = function (user_data, res) {
  const { FromUserName, ToUserName } = user_data
  const item = global.mediaMap.video[Math.floor(Math.random() * global.mediaMap.video.length)]
  let template = `
      <xml>
        <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[video]]></MsgType>
        <Video>
          <MediaId><![CDATA[${item.media_id}]]></MediaId>
          <Title><![CDATA[${item.name}]]></Title>
          <Description><![CDATA[${item.description}]]></Description>
        </Video>
      </xml>
      `
      res.send(template)
}

WeChat.prototype.sendVoiceMedia = function (user_data, res) {
  const { FromUserName, ToUserName } = user_data
  const item = global.mediaMap.voice[Math.floor(Math.random() * global.mediaMap.voice.length)]
  let template = 
      `
      <xml>
        <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[voice]]></MsgType>
        <Voice>
          <MediaId><![CDATA[${item.media_id}]]></MediaId>
        </Voice>
      </xml>
      `
      res.send(template)
}

WeChat.prototype.sendImageMedia = function (user_data, res) {
  const { FromUserName, ToUserName } = user_data
  const item = global.mediaMap.image[Math.floor(Math.random() * global.mediaMap.image.length)]
  let template = 
      `
      <xml>
        <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[image]]></MsgType>
        <Image>
          <MediaId><![CDATA[${item.media_id}]]></MediaId>
        </Image>
      </xml>
      `
      res.send(template)
}

WeChat.prototype.sendNewsMedia = function (user_data, res) {
  const { FromUserName, ToUserName } = user_data
  const item = global.mediaMap.news[Math.floor(Math.random() * global.mediaMap.news.length)]
  let template = 
      `
      <xml>
        <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[news]]></MsgType>
        <ArticleCount>1</ArticleCount>
        <Articles>
          <item>
            <Title><![CDATA[${item.title}]]></Title>
            <Description><![CDATA[${item.digest}]]></Description>
            <PicUrl><![CDATA[${item.url}]]></PicUrl>
            <Url><![CDATA[${item.url}]]></Url>
          </item>
        </Articles>
      </xml>
      `
      res.send(template)
}

WeChat.prototype.sendOthersMedia = function (user_data, res, type) {
  const { FromUserName, ToUserName } = user_data
  let item = {}
  if (type == 'gif') {
    item = global.mediaMap.image[Math.floor(Math.random() * global.mediaMap.image.length)]
    item.title = '摸摸头'
    item.description = '不哭'
    item.picUrl = item.url
    item.url = 'https://mp.weixin.qq.com/s?__biz=MzkwNTQyMTg2OA==&mid=2247483663&idx=1&sn=d110c79e6cbb6b62ac1c4cfa1a8be538&chksm=c0f6b44cf7813d5a2b49a27e64b0294699eabd4bc539cf0b568b40297cea2d89aee1d41f2f65#rd'
  }
  if (type == 'flower') {
    item.title = '💐'
    item.description = '送你一朵花束般的'
    item.picUrl = 'cloudbase-baas-7gfw5zoncc716703-1258613356.tcloudbaseapp.com/flower.jpeg'
    item.url = 'cloudbase-baas-7gfw5zoncc716703-1258613356.tcloudbaseapp.com/flower'
  }
  if (type == 'bear') {
    item.title = '🐻'
    item.description = '可爱小熊'
    item.picUrl = 'cloudbase-baas-7gfw5zoncc716703-1258613356.tcloudbaseapp.com/bear.jpeg'
    item.url = 'cloudbase-baas-7gfw5zoncc716703-1258613356.tcloudbaseapp.com/bear'
  }
  
  let template = 
      `
      <xml>
        <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[news]]></MsgType>
        <ArticleCount>1</ArticleCount>
        <Articles>
          <item>
            <Title><![CDATA[${item.title}]]></Title>
            <Description><![CDATA[${item.description}]]></Description>
            <PicUrl><![CDATA[${item.picUrl}]]></PicUrl>
            <Url><![CDATA[${item.url}]]></Url>
          </item>
        </Articles>
      </xml>
      `
      res.send(template)
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

WeChat.prototype.GetNewsMediaList = function () {
  var self = this
  let option = {
    url: 'https://nlp.tencentcloudapi.com',
    qs: {
      Action: 'ChatBot',
      Version: '2019-04-08',
      Region: 'ap-guangzhou',
      
      access_token: self.accessToken.access_token
    },
    body: {
      "type": "news",
      "offset": 0,
      "count": 20
    },
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
      console.log('图文返回')
      console.log(body.item)
      resolve(body.item)
    })
  })
  

}


module.exports.WeChat = WeChat;
