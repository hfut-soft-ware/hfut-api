import axios from 'axios'
import FormData from 'form-data'
import * as CryptoJS from 'crypto-js'
import qs from 'qs'
import { createInstance } from '../shared/service/base'

const url_1 = 'https://cas.hfut.edu.cn/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252Fhome%252Findex%26response_type%3Dcode%26client_name%3DCasOAuthClient'
const url_2 = 'https://cas.hfut.edu.cn/cas/checkInitVercode'
const url_3 = 'https://cas.hfut.edu.cn/cas/policy/checkUserIdenty'
const ref = 'https://cas.hfut.edu.cn/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252F%26response_type%3Dcode%26client_name%3DCasOAuthClient'

const headers = {
  cookie: '',
}

function combineCookieToHeaders(cookie: string) {
  cookie = cookie.replace('; Path=/cas/; Secure; HttpOnly', '')
  headers.cookie += `${cookie}; `
}

function getCookie(cname: string) {
  let name = `${cname}=`
  let ca = headers.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim()
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

function encryptionPwd(pwd: string) {
  let secretKey = getCookie('LOGIN_FLAVORING')
  let key = CryptoJS.enc.Utf8.parse(secretKey)
  let password = CryptoJS.enc.Utf8.parse(pwd)
  let encrypted = CryptoJS.AES.encrypt(password, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 })
  let encryptedPwd = encrypted.toString()
  return encryptedPwd
}

export async function login({ username, password }: { username: string; password: string }) {
  if (headers.cookie !== '') {
    headers.cookie = ''
  }

  // 获取cookie
  const res1 = await axios.get(url_1)
  combineCookieToHeaders(res1.headers['set-cookie']![0])

  const res2 = await axios.get(url_2, { headers })
  const cookies1 = res2.headers['set-cookie'] as string[]
  cookies1.forEach((cookie) => {
    combineCookieToHeaders(cookie)
  })
  password = encryptionPwd(password)

  // 验证账号密码
  const res3 = await axios.get(url_3, { headers, params: { username, password } })
  const authFlag = res3.data.data.authFlag
  console.log(authFlag)

  if (!authFlag) {
    return false
  }

  // SESSION=94290e6e-b0fe-4e6c-93ec-7fc54f622ccb; JSESSIONID=7db38ed4494247dcaa09ccffddaddc7a; LOGIN_FLAVORING=ck1g1h9nuwr67xnj
  const cachedCookie = headers.cookie.split('; ')
  headers.cookie = `${cachedCookie[0]};${cachedCookie[2]};${cachedCookie[1]}`

  try {
    const res = await axios.post('https://cas.hfut.edu.cn/cas/login', qs.stringify({ username, password, ref }), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        ...headers,
      },
    })
    console.log(res.request['set-cookie'])
  } catch (err) {
    console.log(err)
  }
}
