import { AxiosError } from 'axios'
import request from '../shared/request'
import { IQuery } from '../server'
import login_verify from './login_verify'

const url1 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fwebvpn.hfut.edu.cn%2Flogin%3Fcas_login%3Dtrue'

export default async function login(query: IQuery) {
  const res = await login_verify(query)

  if ((res as any).code !== 200) {
    return res
  }

  const cookie1 = res?.data?.cookie || ''

  // 信息门户
  const oneToken = await getOneToken(cookie1.replace('; Path=/; Domain=webvpn.hfut.edu.cn; HttpOnly', ''), query)

  // 登录教务
  const eamUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login'
  await request(eamUrl, { maxRedirects: 5 }, {
    cookie: cookie1,
  })

  // 感兴趣的可以执行一下下面的逻辑，会输出你个人的信息
  // const studentInfo = await request({ config: { url: 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/student/home-page/students?vpn-12-o1-jxglstu.hfut.edu.cn' } })
  // console.log(studentInfo.data)

  const cookie = cookie1.replace('; Path=/; Domain=webvpn.hfut.edu.cn; HttpOnly', '')

  return {
    code: 200,
    msg: '登录成功',
    cookie,
    data: {
      cookie,
      oneToken,
    },
  }
}

export async function isLogin(cookie?: string) {
  if (!cookie) {
    return
  }
  try {
    await request(url1, {}, { cookie })
    return false
  } catch (err: any) {
    return true
  }
}

export async function getOneToken(cookie?: string, query?: IQuery) {
  const payload = { cookie, req: query?.req }

  const now = Date.now()
  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${now}`, { maxRedirects: 0 }, payload)
  await request('https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/auth/oauth/loginUrl?vpn-12-o2-one.hfut.edu.cn&type=portal&redirect=https:%2F%2Fone.hfut.edu.cn%2F', { maxRedirects: 0 }, payload)
  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${now}`, { maxRedirects: 0 }, payload)

  const oneUrl1 = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'

  let redirect1 = ''
  try {
    await request(oneUrl1, {}, payload)
  } catch (err) {
    redirect1 = (err as AxiosError).response!.headers.location
  }

  let ticketRedirect = ''
  try {
    await request(redirect1, { }, payload)
  } catch (err) {
    ticketRedirect = (err as AxiosError).response!.headers.location
  }

  let redirect2 = ''
  try {
    await request(ticketRedirect, {}, payload)
  } catch (err) {
    redirect2 = (err as AxiosError).response!.headers.location
  }

  await request(redirect2, { maxRedirects: 0 }, payload)

  let code = ''
  const codeUrl = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https://one.hfut.edu.cn/'
  try {
    await request(codeUrl, {}, payload)
  } catch (err) {
    const ext = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/?'
    code = (err as AxiosError).response!.headers.location.replace(ext, '').split('=')[1]
  }

  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=https&path=/cas/oauth2.0/authorize&vpn_timestamp=${now}`, {}, payload)
  await request(`https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=one.hfut.edu.cn&scheme=https&path=/&vpn_timestamp=${now}`, {}, payload)

  // 这一步就是拿到token，拿到token后你可以用返回的cookie和token随意的请求信息门户里面的请求了
  const tokenUrl = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/auth/oauth/getToken?vpn-12-o2-one.hfut.edu.cn&type=portal&redirect=https:%2F%2Fone.hfut.edu.cn%2F%3Fcode%3DOC-233907-7C9021MwztFHlPBezpMqpj8aO05s6j2c'
  const tokenRes = await request(tokenUrl, { params: { code } }, payload)
  const token = tokenRes.body?.data?.access_token

  return token
}
