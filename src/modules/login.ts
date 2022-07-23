import { AxiosError } from 'axios'
import request from '../shared/request'
import { IQuery } from '../server'
import login_verify from './login_verify'

const url1 = 'https://cas.hfut.edu.cn/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252Fhome%252Findex%26response_type%3Dcode%26client_name%3DCasOAuthClient'

export default async function login(query: IQuery) {
  if (query.cookie) {
    query.cookie = ''
  }

  const res = await login_verify(query, true)

  if ((res as any).code !== 200) {
    return res
  }

  const payload = { cookie: (res as any)?.data?.cookie || '' }

  const { cookie: oneCookie } = await loginOne(query.req.query.username as string, (res as any).data.password, payload.cookie)

  payload.cookie = oneCookie

  const { cookie: emaCookie } = await loginEam(payload.cookie)

  payload.cookie = emaCookie

  const cookie = payload.cookie

  return {
    code: 200,
    msg: '登录成功',
    data: {
      cookie,
    },
  }
}

async function loginOne(username: string, password: string, cookie: string) {
  const payload = { cookie }
  let ticketCode = ''
  try {
    await request(url1, {
      url: url1,
      maxRedirects: 0,
      params: {
        username,
        capcha: '',
        execution: 'e1s1',
        _eventId: 'submit',
        password,
        geolocation: '',
      },
    }, payload)
  } catch (err) {
    ticketCode = (err as AxiosError).response!.headers.location.replace('https://cas.hfut.edu.cn/cas/oauth2.0/callbackAuthorize?client_id=BsHfutEduPortal&redirect_uri=https%3A%2F%2Fone.hfut.edu.cn%2Fhome%2Findex&response_type=code&client_name=CasOAuthClient&ticket=', '')
    payload.cookie += `; ${(err as AxiosError).response!.headers['set-cookie']![0].replace(' Path=/cas/; HttpOnly', '').replace(';', '')}`
  }

  try {
    await request('https://cas.hfut.edu.cn/cas/oauth2.0/callbackAuthorize?client_id=BsHfutEduPortal&redirect_uri=https%3A%2F%2Fone.hfut.edu.cn%2Fhome%2Findex&response_type=code&client_name=CasOAuthClient', {
      params: {
        ticket: ticketCode,
      },
    }, payload)
  } catch (err) {
  }

  await request('https://cas.hfut.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https%3A//one.hfut.edu.cn/home/index', {}, payload)

  let code = ''
  try {
    await request('https://cas.hfut.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https%3A//one.hfut.edu.cn/home/index', {}, payload)
  } catch (err) {
    code = (err as AxiosError).response!.headers.location.replace('https://one.hfut.edu.cn/home/index?code=', '')
  }

  await request(`https://one.hfut.edu.cn/home/index?code=${code}`, {}, payload)
  const token = await request(`https://one.hfut.edu.cn/api/auth/oauth/getToken?type=portal&redirect=https%253A%2F%2Fone.hfut.edu.cn%2Fhome%2Findex%253Fcode%253DOC-18370-bzztFDdtywhkaEe2u2dUzDeE1yTYXs-6&code=${code}`, {}, payload)
  return {
    token: token.body.data.access_token,
    cookie: payload.cookie,
  }
}

export async function isLogin(cookie?: string) {
  return true
}

async function loginEam(cookie: string) {
  const payload = { cookie }

  const eamUrl = 'https://cas.hfut.edu.cn/cas/login?service=http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login'

  let location = ''
  try {
    await request(eamUrl, {}, payload)
  } catch (err) {
    location = (err as AxiosError).response!.headers.location
  }

  let session = ''
  try {
    await request(location, {}, payload)
  } catch (err) {
    const cookies = (err as AxiosError).response!.headers['set-cookie'] as string[]
    session = cookies[0].split(';')[0]
  }
  payload.cookie = session
  try {
    await request('http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login', {}, payload)
  } catch (err) {
  }

  // try {
  //   const { body } = await request('http://jxglstu.hfut.edu.cn/eams5-student/ws/student/home-page/students', {}, payload)
  //   console.log(body)
  // } catch (error) {

  // }

  return {
    cookie: payload.cookie,
  }
}
