import request, { communityRequest } from '@/shared/request'
import { encryptionPwd } from '@/shared/login'
import type { ServerFunction } from '@/shared/types'

const loginUrl = 'https://cas.hfut.edu.cn/cas/login?service=https://community.hfut.edu.cn/mp-sso/mini-app-sso.html'

interface LoginDto {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
}

const login: ServerFunction<LoginDto> = async(query) => {
  const { password, username } = query.req.query

  // 首次登录接口
  const loginRes = await request(loginUrl, {}, query)
  const cookie_SESSION = loginRes.cookie![0].split(';')[0]
  query.cookie = cookie_SESSION

  // 不知道干嘛的
  const checkInitParamsRes = await request(`https://cas.hfut.edu.cn/cas/checkInitParams?_=${Date.now()}`, {}, query)
  const [cookie_LOGIN_FLAVORING, cookie_JSESSIONID] = checkInitParamsRes.cookie!
  query.cookie += `; ${cookie_LOGIN_FLAVORING}; ${cookie_JSESSIONID}`

  const LOGIN_FLAVORING = cookie_LOGIN_FLAVORING.split('=')[1]
  const encryedPassword = encryptionPwd(password, LOGIN_FLAVORING)

  // 验证用户名密码接口
  const { body: checkUserIdentyBody } = await request(
    'https://cas.hfut.edu.cn/cas/policy/checkUserIdenty',
    {
      params: {
        username,
        password: encryedPassword,
        _: Date.now(),
      },
    },
    query,
  )
  if (!checkUserIdentyBody.data.authFlag) {
    return {
      code: 400,
      msg: 'username or password error',
    }
  }

  // 第二次登录接口，获取 ticket 字段
  const { headers: loginHeaders } = await request(
    loginUrl,
    {
      params: {
        username,
        password: encryedPassword,
        execution: 'e1s1',
        _eventId: 'submit',
      },
      validateStatus: status => status === 302,
    },
    query,
  )
  const url = new URL(loginHeaders.location)
  const ticket = url.searchParams.get('ticket')

  // 登录小程序，获取 token
  const { body: communityLoginBody } = await request('https://community.hfut.edu.cn/api/sys/cas/client/validateLogin', {
    params: {
      service: 'https://community.hfut.edu.cn/mp-sso/mini-app-sso.html',
      ticket,
    },
  })

  const token = communityLoginBody.result.token as string

  return {
    code: 200,
    msg: 'success',
    cookie: token,
    data: { cookie: token },
  }
}

export const isLogin = async(cookie: string) => {
  try {
    await communityRequest('/api/business/score/querysemesterlist', {}, { cookie })
    return true
  } catch (error) {
    return false
  }
}

export default login
