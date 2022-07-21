import * as CryptoJS from 'crypto-js'
import request, { getCookie } from '../shared/request'
import { IQuery } from '../server'

const url1 = 'https://cas.hfut.edu.cn/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252Fhome%252Findex%26response_type%3Dcode%26client_name%3DCasOAuthClient'

function encryptionPwd(pwd: string, salt: string) {
  let key = CryptoJS.enc.Utf8.parse(salt)
  let password = CryptoJS.enc.Utf8.parse(pwd)
  let encrypted = CryptoJS.AES.encrypt(password, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 })
  return encrypted.toString()
}

export default async function(query: IQuery, getPwd = false) {
  const { req, res } = query
  const username = req.query.username as string
  const password = req.query.password as string

  if (!username || !password) {
    return {
      code: 400,
      msg: '用户名或密码不能为空',
    }
  }
  const res1 = await request(url1, {}, query)

  let cookie1 = getCookie(res1.cookie as string[])
  const payload = { cookie: cookie1 }

  if (!cookie1) {
    res.send({ msg: '登录太过频繁，请稍后再试', code: 400 })
    return
  }

  const vercodeRes = await request('https://cas.hfut.edu.cn/cas/vercode', {}, payload)
  payload.cookie += `; ${vercodeRes.cookie![0] || ''}`

  const url2 = `https://cas.hfut.edu.cn/cas/checkInitVercode?_=${Date.now()}`
  const res2 = await request(url2, {}, payload)
  payload.cookie += `; ${res2.cookie![0] || ''}`
  payload.cookie = payload.cookie.replace(' Path=/cas/; Secure; HttpOnly;', '')

  const saltKey = res2.cookie![0].split('=')[1]

  const encryptedPwd = encryptionPwd(password, saltKey)
  const url3 = `https://cas.hfut.edu.cn/cas/policy/checkUserIdenty?username=${username}&password=${encryptedPwd}&_=${Date.now()}`

  const res3 = await request(url3, {}, payload)

  if (res3.body.data.authFlag) {
    const res = {
      code: 200,
      msg: '登录成功',
      data: {
        cookie: payload.cookie,
      },
    }
    if (getPwd) {
      Reflect.set(res.data, 'password', encryptedPwd)
    }
    return res
  } else {
    return {
      code: 400,
      msg: '用户名或密码错误',
    }
  }
}
