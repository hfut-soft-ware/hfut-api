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

  const { token, cookie: oneCookie } = await loginOne(query.req.query.username as string, (res as any).data.password, payload.cookie)

  payload.cookie = oneCookie

  // 登录教务
  const eamUrl = 'https://cas.hfut.edu.cn/cas/login?service=http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login'
  let firstRed = ''
  try {
    const res = await request(eamUrl, { maxRedirects: 0 })
  } catch (err) {
    firstRed = (err as AxiosError).response!.headers.location
  }
  console.log(firstRed)

  // 感兴趣的可以执行一下下面的逻辑，会输出你个人的信息
  // const studentInfo = await request('http://jxglstu.hfut.edu.cn/eams5-student/ws/student/home-page/students', {}, payload)
  // console.log(studentInfo.body)

  payload.cookie = payload.cookie.split('; ')[0]
  const cookie = payload.cookie

  return {
    code: 200,
    msg: '登录成功',
    cookie,
    data: {
      cookie,
      token,
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
