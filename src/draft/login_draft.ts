import * as CryptoJS from 'crypto-js'
import axios, { Axios, AxiosError } from 'axios'
import { createInstance } from '../shared/service/base'

const headers = { 'cookie': '', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36' }

const url1 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fwebvpn.hfut.edu.cn%2Flogin%3Fcas_login%3Dtrue'
const url2 = 'https://webvpn.hfut.edu.cn/wengine-vpn/input'
const url3 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/checkInitVercode?vpn-12-o1-cas.hfut.edu.cn='
const url4 = 'https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=http&path=/cas/login'

const instance = createInstance({ withCredentials: true, maxRedirects: 0 })

const baseUrl = 'https://webvpn.hfut.edu.cn/https'

let pwd = ''

function encryptionPwd(pwd: string, salt: string) {
  let secretKey = salt
  let key = CryptoJS.enc.Utf8.parse(secretKey)
  let password = CryptoJS.enc.Utf8.parse(pwd)
  let encrypted = CryptoJS.AES.encrypt(password, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 })
  let encryptedPwd = encrypted.toString()
  return encryptedPwd
}

export default async function loginVpn() {
  const time = Date.now()

  const res1 = await instance.get(url1, { headers })
  res1.headers['set-cookie']?.forEach(cookie => headers.cookie += `${cookie};`)

  await instance.get(url2, { headers, params: { type: 'text', name: 'username', value: '2021217986' }, maxRedirects: 1 })

  await instance.get(url3, { headers, params: { _: time } })
  const res4 = await instance.get(url4, { headers, params: { vpn_timestamp: time } })
  const key = res4.data.split('; ')[1].split('=')[1]
  pwd = encryptionPwd('', key)
  const url5 = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/policy/checkUserIdenty?vpn-12-o1-cas.hfut.edu.cn=&username=2021217986&password=${pwd}&_=${time}`
  const res5 = await instance.get(url5, { headers })

  const authFlag = res5.data.data.authFlag

  if (!authFlag) {
    return false
  }

  const url6 = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252Fhome%252Findex%26response_type%3Dcode%26client_name%3DCasOAuthClient'
  let ticketRedirect = baseUrl

  try {
    await instance.get(url6, {
      headers,
      maxRedirects: 0,
      params: {
        username: '2021217986',
        capcha: '',
        execution: 'e1s1',
        _eventId: 'submit',
        password: pwd,
        geolocation: '',
      },
    })
  } catch (err) {
    ticketRedirect = (err as AxiosError).response!.headers.location
  }

  const cookieRes = await instance.get(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=http&path=/cas/login&vpn_timestamp=${time}`, { headers })

  let tokenDirect = baseUrl

  try {
    await instance.get(ticketRedirect, { headers })
  } catch (err) {
    tokenDirect += (err as AxiosError).response!.headers.location
  }

  await instance.get(tokenDirect, { headers, maxRedirects: 3 })

  await loginOneVpn()
}

const instance2 = createInstance({ maxRedirects: 0 })
async function loginOneVpn() {
  const time = Date.now()
  const url1 = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'

  await instance2.get(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${time}`, { headers, maxRedirects: 0 })
  await instance2.get('https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/auth/oauth/loginUrl?vpn-12-o2-one.hfut.edu.cn&type=portal&redirect=https:%2F%2Fone.hfut.edu.cn%2F', { headers, maxRedirects: 0 })
  await instance2.get(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${time}`, { headers, maxRedirects: 0 })

  let redirect1 = ''
  try {
    await instance2.get(url1, { headers })
  } catch (err) {
    redirect1 = (err as AxiosError).response!.headers.location
  }

  let ticketRedirect = ''
  try {
    await instance2.get(redirect1, { headers, maxRedirects: 0 })
  } catch (err) {
    ticketRedirect = (err as AxiosError).response!.headers.location
  }

  let redirect2 = ''
  try {
    await instance2.get(ticketRedirect, { headers })
  } catch (err) {
    redirect2 = (err as AxiosError).response!.headers.location
  }

  await instance2.get(redirect2, { headers, maxRedirects: 0 })

  const url = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'

  let code = ''
  try {
    await instance.get(url, { headers, maxRedirects: 0 })
  } catch (err) {
    const ext = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/?'
    code = (err as AxiosError).response!.headers.location.replace(ext, '').split('=')[1]
  }

  await instance.get(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=https&path=/cas/oauth2.0/authorize&vpn_timestamp=${time}`, { headers })
  await instance.get(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${time}`, { headers })

  const tokenUrl = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/auth/oauth/getToken?vpn-12-o2-one.hfut.edu.cn&type=portal&redirect=https:%2F%2Fone.hfut.edu.cn%2F%3Fcode%3DOC-233907-7C9021MwztFHlPBezpMqpj8aO05s6j2c'
  const tokenRes = await instance.get(tokenUrl, { headers, params: { code } })
  const token = tokenRes.data.data.access_token

  const test = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/center/user/selectUserInfoForHall?vpn-12-o2-one.hfut.edu.cn'
  const res = await instance.get(test, { headers: { ...headers, Authorization: `Bearer ${token}` } })

  await loginVpnEam()
}

async function loginVpnEam() {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login'
  const time = Date.now()
  await axios.get(url, { headers, maxRedirects: 5 })
  const studentInfo = await axios.get('https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/student/home-page/students?vpn-12-o1-jxglstu.hfut.edu.cn', { headers })
  console.log(studentInfo.data)
}
