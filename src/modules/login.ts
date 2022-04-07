import axios, { AxiosRequestHeaders } from 'axios'

const url_1 = 'https://cas.hfut.edu.cn/cas/login?service=https%3A%2F%2Fcas.hfut.edu.cn%2Fcas%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3DBsHfutEduPortal%26redirect_uri%3Dhttps%253A%252F%252Fone.hfut.edu.cn%252Fhome%252Findex%26response_type%3Dcode%26client_name%3DCasOAuthClient'
const url_2 = 'https://cas.hfut.edu.cn/cas/checkInitVercode'
const url_3 = 'https://cas.hfut.edu.cn/cas/policy/checkUserIdenty'

const headers: AxiosRequestHeaders = {
  cookie: '',
}

export async function login({ username, password }: { username: string; password: string }) {
  // 获取cookie
  const res1 = await axios.get(url_1)
  const cookie1 = res1.headers['set-cookie']![0]
  headers.cookie = cookie1

  const requestHeaders = headers
  const res2 = await axios.get(url_2, { headers: requestHeaders })
  const cookies2 = res2.headers['set-cookie'] as string[]
  cookies2.forEach((cookie) => {
    headers.cookie += `${cookie};`
  })
  // 验证账号密码
  const res3 = await axios.get(url_3, { headers, params: { username, password } })
  const authFlag = res3.data.data.authFlag
  if (!authFlag) {
    return false
  }
}
