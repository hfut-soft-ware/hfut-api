import { AxiosError } from 'axios'
import request from '../shared/request'
import { IQuery } from '../server'
import login_verify from './login_verify'

export default async function login(query: IQuery) {
  if (query.cookie) {
    query.cookie = ''
  }

  const res = await login_verify(query, true)

  if ((res as any).code !== 200) {
    return res
  }

  const payload = { cookie: (res as any)?.data?.cookie || '' }

  const { cookie: oneCookie } = await loginOne(payload.cookie, res?.data?.ticketCode || '')

  payload.cookie = oneCookie

  const { cookie: emaCookie } = await loginEam(payload.cookie)

  payload.cookie = emaCookie

  const cookie = payload.cookie

  return {
    code: 200,
    msg: '登录成功',
    cookie,
    data: {
      cookie,
      oneLoginCookie: res!.data!.cookie.split('; ')[3],
    },
  }
}

async function loginOne(cookie: string, ticketCode: string) {
  const payload = { cookie }

  try {
    await request('https://cas.hfut.edu.cn/cas/oauth2.0/callbackAuthorize?client_id=BsHfutEduPortal&redirect_uri=https%3A%2F%2Fone.hfut.edu.cn%2Fhome%2Findex&response_type=code&client_name=CasOAuthClient', {
      params: {
        ticket: ticketCode,
      },
    }, payload)
  } catch (err) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }
  }

  await request('https://cas.hfut.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https%3A//one.hfut.edu.cn/home/index', {}, payload)

  let code = ''
  try {
    await request('https://cas.hfut.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https%3A//one.hfut.edu.cn/home/index', {}, payload)
  } catch (err) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }
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
  if (!cookie) {
    return
  }

  try {
    await request('https://cas.hfut.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=BsHfutEduPortal&redirect_uri=https%3A//one.hfut.edu.cn/home/index', {}, { cookie })
  } catch (err: any) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }
    const redirectUrl = (err as AxiosError).response?.headers?.location || ''
    if (!redirectUrl.includes('code')) {
      return false
    }

    return true
  }
}

async function loginEam(cookie: string) {
  const payload = { cookie }

  const eamUrl = 'https://cas.hfut.edu.cn/cas/login?service=http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login'

  let location = ''
  try {
    await request(eamUrl, {}, payload)
  } catch (err) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }
    location = (err as AxiosError).response!.headers.location
  }

  let session = ''
  try {
    await request(location, {}, payload)
  } catch (err) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }

    const cookies = (err as AxiosError).response!.headers['set-cookie'] as string[]
    session = cookies[0].split(';')[0]
  }
  payload.cookie = session
  try {
    await request('http://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login', {}, payload)
  } catch (err) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }
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
