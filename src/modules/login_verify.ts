import { AxiosError } from 'axios'
import * as cheerio from 'cheerio'
import * as CryptoJS from 'crypto-js'
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

export default async function(query: IQuery) {
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
  const res1 = await request(url1, {}, query)

  let cookie1 = getCookie(res1.cookie as string[])

  if (!cookie1) {
    res.send({ msg: '登录太过频繁，请稍后再试', code: 400 })
    return
  }

  const payload = { cookie: cookie1 }

  await request(url2, { params: { _: now }, maxRedirects: 5 }, payload)
  await request(url3, {}, payload)
  const res4 = await request(url4, {}, payload)

  // 加密密码
  const saltKey = (res4.body as string).split('; ')[1].split('=').pop() as string
  const encryptedPwd = encryptionPwd(password, saltKey)

  // auth验证
  const authFlagUrl = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/policy/checkUserIdenty?vpn-12-o1-cas.hfut.edu.cn=&username=${username}&password=${encryptedPwd}&_=${now}`
  await request(authFlagUrl, {}, payload)

  let redirectRes: any = { body: '' }
  try {
    redirectRes = await request(url5, {
      url: url5,
      maxRedirects: 5,
      params: {
        username,
        capcha: '',
        execution: 'e1s1',
        _eventId: 'submit',
        password: encryptedPwd,
        geolocation: '',
      },
    }, {
      cookie: cookie1,
    })
  } catch (err) {
    redirectRes.body = (err as AxiosError).response!.data
  }

  const $ = cheerio.load(redirectRes.body)

  if ($('.alert-danger').children('span').text().trim().includes('该账户已被冻结')) {
    return { code: 400, msg: '该账户已被冻结' }
  }
  // 到这就算是成功登进了webvpn，但还没进信息门户
  const isSuccess = $('.wrdvpn-navbar__title').text().trim() === '合肥工业大学WEBVPN系统' || $('.layui-show-sm-inline-block').text().trim() === '合肥工业大学WEBVPN系统'
  if (!isSuccess) {
    return { code: 400, msg: '账号或密码错误' }
  }

  return {
    code: 200,
    msg: '登录成功',
    data: {
      cookie: cookie1,
    },
  }
}
