import * as CryptoJS from 'crypto-js'
import * as cheerio from 'cheerio'
import { AxiosError } from 'axios'
import request, { getCookie } from '../shared/request'
import { ModulesRequest, ModulesResponse } from '../shared/types'

const url1 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fwebvpn.hfut.edu.cn%2Flogin%3Fcas_login%3Dtrue'
const url2 = 'https://webvpn.hfut.edu.cn/wengine-vpn/input'
const url3 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/checkInitVercode?vpn-12-o1-cas.hfut.edu.cn='
const url4 = 'https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=http&path=/cas/login'
const url5 = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252Fhome%252Findex%26response_type%3Dcode%26client_name%3DCasOAuthClient'

function encryptionPwd(pwd: string, salt: string) {
  let secretKey = salt
  let key = CryptoJS.enc.Utf8.parse(secretKey)
  let password = CryptoJS.enc.Utf8.parse(pwd)
  let encrypted = CryptoJS.AES.encrypt(password, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 })
  let encryptedPwd = encrypted.toString()
  return encryptedPwd
}

export default async function login(req: ModulesRequest, res: ModulesResponse) {
  const username = req.query.username as string
  const password = req.query.password as string

  if (!username || !password) {
    res.status(400).send({ msg: '用户名或密码不能为空' })
    return
  }
  const now = Date.now()
  const res1 = await request({ config: { url: url1 } })
  const cookie1 = getCookie(res1.headers['set-cookie'] as string[])

  await request({ config: { url: url2, params: { _: now }, maxRedirects: 5 }, cookie: cookie1 })
  await request({ config: { url: url3 } })
  const res4 = await request({ config: { url: url4 } })
  // 加密密码
  const saltKey = (res4.data as string).split('; ')[1].split('=').pop() as string
  const encryptedPwd = encryptionPwd(password, saltKey)

  // auth验证
  const authFlagUrl = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/policy/checkUserIdenty?vpn-12-o1-cas.hfut.edu.cn=&username=${username}&password=${encryptedPwd}&_=${now}`
  const authFlagRes = await request({ config: { url: authFlagUrl } })
  const authFlag = authFlagRes.data.data.authFlag

  if (!authFlag) {
    res.status(400).send({ code: 400, msg: '用户名或密码错误' })
  }

  const redirectRes = await request({
    config: {
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
    },
  })

  const $ = cheerio.load(redirectRes.data)
  // 到这就算是成功登进了webvpn，但还没进信息门户
  const isSuccess = $('.layui-show-sm-inline-block').text().trim() === '合肥工业大学WEBVPN系统'

  if (!isSuccess) {
    res.status(400).send({ code: 400, msg: '登录失败' })
  }
  // 信息门户
  const oneUrl1 = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'

  await request({ config: { url: oneUrl1, maxRedirects: 3 } })

  let code = ''
  const codeUrl = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'
  try {
    await request({ config: { url: codeUrl } })
  } catch (err) {
    const ext = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/?'
    code = (err as AxiosError).response!.headers.location.replace(ext, '').split('=')[1]
  }

  await request({ config: { url: `https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=https&path=/cas/oauth2.0/authorize&vpn_timestamp=${now}` } })
  await request({ config: { url: `https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${now}` } })

  // 这一步就是拿到token，拿到token后你可以用返回的cookie和token随意的请求信息门户里面的请求了
  const tokenUrl = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/auth/oauth/getToken?vpn-12-o2-one.hfut.edu.cn&type=portal&redirect=https:%2F%2Fone.hfut.edu.cn%2F%3Fcode%3DOC-233907-7C9021MwztFHlPBezpMqpj8aO05s6j2c'
  const tokenRes = await request({ config: { url: tokenUrl, params: { code } } })
  const token = tokenRes.data?.data?.access_token
  if (!token) {
    res.status(400).send({ code: 400, msg: '登录失败' })
  }

  // 登录教务
  const eamUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login'
  await request({ config: { url: eamUrl, maxRedirects: 5 } })

  // 感兴趣的可以执行一下下面的逻辑，会输出你个人的信息
  // const studentInfo = await request({ config: { url: 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/student/home-page/students?vpn-12-o1-jxglstu.hfut.edu.cn' } })
  // console.log(studentInfo.data)
  res.send({
    code: 200,
    msg: '登录成功',
    cookie: cookie1,
  })
}
