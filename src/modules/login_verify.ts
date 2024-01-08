import * as CryptoJS from 'crypto-js'
import { AxiosError } from 'axios'
import * as cheerio from 'cheerio'
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

  await request(url3, {}, payload)

  try {
    await request(url1, {
      url: url1,
      maxRedirects: 0,
      params: {
        username,
        capcha: '',
        execution: 'e1s1',
        _eventId: 'submit',
        password: encryptedPwd,
        geolocation: '',
      },
    }, payload)
  } catch (err: any) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }

    const $ = cheerio.load((err as AxiosError).response?.data as string || '')

    const errMsg = $('#errorpassword').text().trim()

    if (errMsg.length > 0) {
      return {
        code: 400,
        msg: errMsg,
      }
    }

    const ticketCode = (err as AxiosError).response!.headers.location.replace('https://cas.hfut.edu.cn/cas/oauth2.0/callbackAuthorize?client_id=BsHfutEduPortal&redirect_uri=https%3A%2F%2Fone.hfut.edu.cn%2Fhome%2Findex&response_type=code&client_name=CasOAuthClient&ticket=', '')
    payload.cookie += `; ${(err as AxiosError).response!.headers['set-cookie']![0].replace(' Path=/cas/; HttpOnly', '').replace(';', '')}`

    return {
      code: 200,
      msg: '登录成功',
      data: {
        ticketCode,
        cookie: payload.cookie,
      },
    }
  }
}
