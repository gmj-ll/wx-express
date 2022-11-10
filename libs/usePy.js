const exec = require('child_process').exec;
module.exports = {
  checkVoice (fileName, type, name) {
    return new Promise((resolve, reject) => {
      if (type == 1) {
        exec(`cd python && python infer_recognition.py --audio_path ../wav/${fileName} --type ${type}`,function(error,stdout,stderr){
          if(error) {
              console.info('stderr : '+stderr);
              reject()
          }
          console.log('exec: ' + stdout);
          const matchIndex = stdout.indexOf("识别说话的为")
          if (matchIndex != -1) {
            let subStr = stdout.slice(matchIndex)
            const mathArr = /识别说话的为：([\s\S]*)，/.exec(subStr)
            let name = mathArr[1]
            resolve(name)
          } else {
            reject('识别错误')
          }
        })
      } else {
        exec(`cd python && python3 infer_recognition.py --audio_path ../wav/${fileName} --type ${type} --name ${name}`,function(error,stdout,stderr){
          if(error) {
            console.info('stderr : '+stderr);
            reject()
          } else {
            resolve()
          }
        })
      }
      
    })
    
  }
}
