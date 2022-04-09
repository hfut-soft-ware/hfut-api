import express from 'express'
import * as CryptoJS from 'crypto-js'
import config from './src/config/config'
import { login } from './src/modules/login'
import { dormitoryInspection } from './src/modules/dormitoryInspection'
import { loginVpn } from './src/modules/login_vpn'

const app = express()

function encryptionPwd(pwd: string) {
  let secretKey = 'm1gsi4aqlee2prsj'
  let key = CryptoJS.enc.Utf8.parse(secretKey)
  let password = CryptoJS.enc.Utf8.parse(pwd)
  let encrypted = CryptoJS.AES.encrypt(password, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 })
  let encryptedPwd = encrypted.toString()
  return encryptedPwd
}

app.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`)
  loginVpn()
  console.log(encryptionPwd('Ai200212243614'))
})

app.get('/login', async(req, res) => {
  const query = req.query
  const result = await login({ username: query.username as string, password: query.password as string })

  if (!result) {
    res.send({
      code: -1,
      msg: '账号或密码错误',
    })

    return
  }

  res.send({
    code: 1,
    msg: '登录成功',
    data: result,
  })
})

app.get('/dormitory', async(req, res) => {
  const query = req.query
  if (!query.code) {
    res.send({
      code: -1,
      msg: '请输入宿舍号',
    })
    return
  }

  const data = await dormitoryInspection({ studentCode: query.code as string })

  res.send({
    code: 1,
    msg: '',
    data,
  })
})
