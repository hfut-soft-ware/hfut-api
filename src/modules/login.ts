import * as CryptoJS from 'crypto-js'
import * as cheerio from 'cheerio'
import { AxiosError } from 'axios'
import request, { getCookie } from '../shared/request'
import { IQuery } from '../server'

const url1 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fwebvpn.hfut.edu.cn%2Flogin%3Fcas_login%3Dtrue'
const url2 = 'https://webvpn.hfut.edu.cn/wengine-vpn/input'
const url3 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/checkInitVercode?vpn-12-o1-cas.hfut.edu.cn='
const url4 = 'https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=http&path=/cas/login'
const url5 = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252Fhome%252Findex%26response_type%3Dcode%26client_name%3DCasOAuthClient'

function encryptionPwd(pwd: string, salt: string) {
  let key = CryptoJS.enc.Utf8.parse(salt)
  let password = CryptoJS.enc.Utf8.parse(pwd)
  let encrypted = CryptoJS.AES.encrypt(password, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 })
  return encrypted.toString()
}

export default async function login(query: IQuery) {
  const { req, res } = query
  const username = req.query.username as string
  const password = req.query.password as string

  if (!username || !password) {
    return {
      code: 400,
      msg: '用户名或密码不能为空',
    }
  }
  const now = Date.now()
  const res1 = await request(url1, {})

  let cookie1 = getCookie(res1.cookie as string[])

  if (!cookie1) {
    res.send({ msg: '登录太过频繁，请稍后再试', code: 502 })
    return
  }

  await request(url2, { params: { _: now }, maxRedirects: 5 }, cookie1)
  await request(url3, {}, cookie1)
  const res4 = await request(url4, {}, cookie1)

  // 加密密码
  const saltKey = (res4.body as string).split('; ')[1].split('=').pop() as string
  const encryptedPwd = encryptionPwd(password, saltKey)

  // auth验证
  const authFlagUrl = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/policy/checkUserIdenty?vpn-12-o1-cas.hfut.edu.cn=&username=${username}&password=${encryptedPwd}&_=${now}`
  await request(authFlagUrl, {}, cookie1)

  let redirectRes: any = { body: '' }
  try {
    redirectRes = await request(url5, {
      url: url5,
      maxRedirects: 5,
      params: {
        username: '2021217986',
        capcha: '',
        execution: 'e1s1',
        _eventId: 'submit',
        password: encryptedPwd,
        geolocation: '',
      },
    }, cookie1)
  } catch (err) {
    redirectRes.body = (err as AxiosError).response!.data
  }

  const $ = cheerio.load(redirectRes.body)

  if ($('.alert-danger').children('span').text().trim() === '该账户已被冻结' || $('#errorpassword').text().length !== 0) {
    return { code: 400, msg: '该账户已被冻结' }
  }
  // 到这就算是成功登进了webvpn，但还没进信息门户
  const isSuccess = $('.layui-show-sm-inline-block').text().trim() === '合肥工业大学WEBVPN系统'

  if (!isSuccess) {
    return { code: 400, msg: '登录失败' }
  }
  // 信息门户
  const oneToken = await getOneToken(cookie1.replace('; Path=/; Domain=webvpn.hfut.edu.cn; HttpOnly', ''))

  // 登录教务
  const eamUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login'
  await request(eamUrl, { maxRedirects: 5 }, cookie1)

  // 感兴趣的可以执行一下下面的逻辑，会输出你个人的信息
  // const studentInfo = await request({ config: { url: 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/student/home-page/students?vpn-12-o1-jxglstu.hfut.edu.cn' } })
  // console.log(studentInfo.data)

  const cookie = cookie1.replace('; Path=/; Domain=webvpn.hfut.edu.cn; HttpOnly', '')

  return {
    code: 200,
    msg: '登录成功',
    cookie,
    data: {
      oneToken,
    },
  }
}

export async function isLogin(cookie?: string) {
  if (!cookie) {
    return
  }
  try {
    await request(url1, {}, cookie)
    return false
  } catch (err: any) {
    return true
  }
}

export async function getOneToken(cookie?: string) {
  const now = Date.now()
  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${now}`, { maxRedirects: 0 }, cookie)
  await request('https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/auth/oauth/loginUrl?vpn-12-o2-one.hfut.edu.cn&type=portal&redirect=https:%2F%2Fone.hfut.edu.cn%2F', { maxRedirects: 0 }, cookie)
  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${now}`, { maxRedirects: 0 }, cookie)

  const oneUrl1 = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'

  let redirect1 = ''
  try {
    await request(oneUrl1, {}, cookie)
  } catch (err) {
    redirect1 = (err as AxiosError).response!.headers.location
  }

  let ticketRedirect = ''
  try {
    await request(redirect1, { }, cookie)
  } catch (err) {
    ticketRedirect = (err as AxiosError).response!.headers.location
  }

  let redirect2 = ''
  try {
    await request(ticketRedirect, {}, cookie)
  } catch (err) {
    redirect2 = (err as AxiosError).response!.headers.location
  }

  await request(redirect2, { maxRedirects: 0 }, cookie)

  let code = ''
  const codeUrl = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'
  try {
    await request(codeUrl, {}, cookie)
  } catch (err) {
    const ext = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/?'
    code = (err as AxiosError).response!.headers.location.replace(ext, '').split('=')[1]
  }

  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=https&path=/cas/oauth2.0/authorize&vpn_timestamp=${now}`, {}, cookie)
  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${now}`, {}, cookie)

  // 这一步就是拿到token，拿到token后你可以用返回的cookie和token随意的请求信息门户里面的请求了
  const tokenUrl = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/auth/oauth/getToken?vpn-12-o2-one.hfut.edu.cn&type=portal&redirect=https:%2F%2Fone.hfut.edu.cn%2F%3Fcode%3DOC-233907-7C9021MwztFHlPBezpMqpj8aO05s6j2c'
  const tokenRes = await request(tokenUrl, { params: { code } }, cookie)
  const token = tokenRes.body?.data?.access_token

  return token
}
