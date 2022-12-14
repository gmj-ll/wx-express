const express = require('express')
const bodyParser = require('body-parser')
const {
  getUserDataAsync,
  parseXmlData,
  formatMsg
} = require("./libs/utils")

var fs = require('fs')

var {
  WeChat
} = require('./libs/wx');


const tencentcloud = require("tencentcloud-sdk-nodejs")

// 导入对应产品模块的client models。
const NlpClient = tencentcloud.nlp.v20190408.Client

// 实例化要请求产品(以cvm为例)的client对象
const client = new NlpClient({
  // 腾讯云认证信息
  credential: {
    secretId: "AKIDxITaYRG4hBSfibfmntvCTenw6fBlMyX2",
    secretKey: "b8X90064ZF8vZ6UhTksqeKNJ1ZuGZjHb",
  },
  // 产品地域
  region: "ap-guangzhou",
  // 可选配置实例
  profile: {
    signMethod: "TC3-HMAC-SHA256", // 签名方法
    httpProfile: {
      endpoint: "nlp.tencentcloudapi.com"
      // reqMethod: "POST", // 请求方法
      // reqTimeout: 30, // 请求超时时间，默认60s
      // proxy: "http://127.0.0.1:8899" // http请求代理
    },
  },
})
// 通过client对象调用想要访问的接口（Action），需要传入请求对象（Params）以及响应回调函数
// 即：client.Action(Params).then(res => console.log(res), err => console.error(err))
// 如：查询云服务器可用区列表


var {
  errorMsgs,
  successMsgs,
  medias
} = require('./static')

var {
  check,
  bind
} = require('./libs/check')

var wechat = new WeChat({
  App_Id: 'wx117698d319ab8832',
  App_Secret: '200ae30c7db2488ebba2f57bbadfa0cb'
})

global.isFindMaster = false



const files = fs.readdirSync('./python/audio_db')
if (files.length > 1) {
  global.isFindMaster = true
} else {
  global.isFindMaster = false
}

global.reqMsgIds = {}

global.openIdStatus = {}

global.mediaMap = {
  image: [],
  video: [],
  voice: [],
  news: []
}

wechat.GetAccessToken().then(success => {
  wechat.GetImageMediaList().then(res => {
    global.mediaMap.image = res
  })
  wechat.GetVideoList().then(res => {
    global.mediaMap.video = res
  })
  wechat.GetVoiceMediaList().then(res => {
    global.mediaMap.voice = res
  })
  wechat.GetNewsMediaList().then(res => {
    global.mediaMap.news = res
  })
  console.log('初始化获取accessToken成功')
}, failure => {
  console.log('初始化获取accessToken失败')
})


const PORT = process.env.PORT || 80

const app = express()

app.use(bodyParser.raw())
app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('/', (req, res) => {
  if (req.query.echostr) {
    const {
      echostr
    } = req.query
    res.send(echostr)
  } else {
    res.send('get')
  }

})

app.post('/', async (req, res) => {
  const xml_data = await getUserDataAsync(req)
  let user_data = await parseXmlData(xml_data)
  user_data = formatMsg(user_data)
  const {
    MsgType,
    Content,
    FromUserName,
    ToUserName,
    Event
  } = user_data

  if (Event == 'subscribe') {
    wechat.subscribe(user_data, res)
  } else if (Event == 'unsubscribe') {
    global.openIdStatus[FromUserName] = false
  } else {
    if (MsgType == 'voice') {
      if (global.isFindMaster) { // check
        check(user_data, wechat, res)
      } else { // bind
        bind(user_data, wechat, res)
      }
    } else if (global.openIdStatus[FromUserName]) {
      if (Content == '视频') {
        wechat.sendVideoMedia(user_data, res)
        return
      } else if (Content == '语音') {
        wechat.sendVoiceMedia(user_data, res)
      }
      // else if (Content == '图片') {
      //   wechat.sendImageMedia(user_data, res)
      // }
      // else if (Content == '图文') {
      //   wechat.sendNewsMedia(user_data, res)
      // }
      else if (Content == '动图') {
        wechat.sendOthersMedia(user_data, res, 'gif')
      } else if (Content == '花') {
        wechat.sendOthersMedia(user_data, res, 'flower')
      } else if (Content == '小熊') {
        wechat.sendOthersMedia(user_data, res, 'bear')
      } else {
        client.ChatBot({
          "Query": Content
        }).then(
          (data) => {
            let replyMessage = `<xml>
                  <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
                  <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
                  <CreateTime>${Date.now()}</CreateTime>
                  <MsgType><![CDATA[text]]></MsgType>
                  <Content><![CDATA[${data.Reply}]]></Content>
                  </xml>`
            res.send(replyMessage)
          },
          (err) => {
            let errorMsg = errorMsgs[Math.floor((Math.random() * errorMsgs.length))]
            let replyMessage = `<xml>
                  <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
                  <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
                  <CreateTime>${Date.now()}</CreateTime>
                  <MsgType><![CDATA[text]]></MsgType>
                  <Content><![CDATA[${errorMsg}]]></Content>
                  </xml>`
            res.send(replyMessage)
          }
        )
      }
    } else {
      client.ChatBot({
        "Query": Content
      }).then(
        (data) => {
          let replyMessage = `<xml>
                <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
                <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
                <CreateTime>${Date.now()}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${data.Reply}]]></Content>
                </xml>`
          res.send(replyMessage)
        },
        (err) => {
          let errorMsg = errorMsgs[Math.floor((Math.random() * errorMsgs.length))]
          let replyMessage = `<xml>
                <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
                <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
                <CreateTime>${Date.now()}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${errorMsg}]]></Content>
                </xml>`
          res.send(replyMessage)
        }
      )

    }
  }

})

// app.get('/test', (req, res) => {
//   wechat.postMedia()
//   res.send('hello')
// })

// app.all('/', async (req, res) => {
//   console.log('消息推送', req.body)
//   const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
//   if (MsgType === 'text') {
//     if (Content === '回复文字') {
//       res.send({
//         ToUserName: FromUserName,
//         FromUserName: ToUserName,
//         CreateTime: CreateTime,
//         MsgType: 'text',
//         Content: '这是回复的消息'
//       })
//     } else if (Content === '回复图片') {
//       res.send({
//         ToUserName: FromUserName,
//         FromUserName: ToUserName,
//         CreateTime: CreateTime,
//         MsgType: 'image',
//         Image: {
//           //需要替换MediaID
//           MediaId: 'h5HlJXE_4qH5MjLN-fnRu7QT5U4V1bLILEFPkliGrXRNU8vCYThZK-SgtCKoTecS'
//         }
//       })
//     } else if (Content === '回复语音') {
//       res.send({
//         ToUserName: FromUserName,
//         FromUserName: ToUserName,
//         CreateTime: CreateTime,
//         MsgType: 'voice',
//         Voice: {
//           //需要替换MediaID
//           MediaId: '06JVovlqL4v3DJSQTwas1QPIS-nlBlnEFF-rdu03k0dA9a_z6hqel3SCvoYrPZzp'
//         }
//       })
//     } else if (Content === '回复视频') {
//       res.send({
//         ToUserName: FromUserName,
//         FromUserName: ToUserName,
//         CreateTime: CreateTime,
//         MsgType: 'video',
//         Video: {
//           //需要替换MediaID
//           MediaId: 'h5HlJXE_4qH5MjLN-fnRu5Dos4aaDNh_9yHD4s9qvWTURJt2JpT7thyTYpZeJ9Vz',
//           Title: '视频名称',
//           Description: '视频介绍内容'
//         }
//       })
//     } else if (Content === '回复音乐') {
//       res.send({
//         ToUserName: FromUserName,
//         FromUserName: ToUserName,
//         CreateTime: CreateTime,
//         MsgType: 'music',
//         Music: {
//           //需要替换ThumbMediaId
//           Title: '音乐名称',
//           Description: '每日推荐一个好听的音乐，感谢收听～',
//           MusicUrl: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
//           HQMusicUrl: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
//           ThumbMediaId: 'h5HlJXE_4qH5MjLN-fnRu7QT5U4V1bLILEFPkliGrXRNU8vCYThZK-SgtCKoTecS'
//         }
//       })
//     } else if (Content === '回复图文') {
//       res.send({
//         ToUserName: FromUserName,
//         FromUserName: ToUserName,
//         CreateTime: CreateTime,
//         MsgType: 'news',
//         ArticleCount: 1,
//         Articles: [{
//           Title: 'Relax｜今日推荐音乐',
//           Description: '每日推荐一个好听的音乐，感谢收听～',
//           PicUrl: 'https://y.qq.com/music/photo_new/T002R300x300M000004NEn9X0y2W3u_1.jpg?max_age=2592000',
//           Url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U'
//         }]
//       })
//     } else {
//       res.send({
//         ToUserName: FromUserName,
//         FromUserName: ToUserName,
//         CreateTime: CreateTime,
//         MsgType: 'text',
//         Content: '收到，可能会在一天内回复~'
//       })
//     }
//   } else {
//     res.send('success')
//   }
// })
app.use(async (err,req, res, next) => {

  const xml_data = await getUserDataAsync(req)
  let user_data = await parseXmlData(xml_data)
  user_data = formatMsg(user_data)
  const {
    FromUserName,
    ToUserName,
  } = user_data
  const err_log = `
      +---------------+-------------------------+
      错误名称：${err.name},\n
      错误信息：${err.message},\n
      错误时间：${new Date()},\n
      错误堆栈：${err.stack},\n
      +---------------+-------------------------+
  `
  fs.appendFile(path.join(__dirname,"error.log"),err_log,()=>{
    let replyMessage = `<xml>
          <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
          <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
          <CreateTime>${Date.now()}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[我故障了，请摇人来]]></Content>
          </xml>`
    res.send(replyMessage)
  });
})
app.listen(PORT, function () {
  console.log(`运行成功，端口：${PORT}`)
})