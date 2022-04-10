import request, { getCookie } from '../shared/request'

const url1 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=https%3A%2F%2Fwebvpn.hfut.edu.cn%2Flogin%3Fcas_login%3Dtrue'
const url2 = 'https://webvpn.hfut.edu.cn/wengine-vpn/input'
const url3 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/checkInitVercode?vpn-12-o1-cas.hfut.edu.cn='
const url4 = 'https://webvpn.hfut.edu.cn/wengine-vpn/cookie?method=get&host=cas.hfut.edu.cn&scheme=http&path=/cas/login'

export default async function login({ username, password }: { username: string; password: string }) {
  const now = Date.now()
  const res1 = await request({ config: { url: url1 } })
  const cookie1 = getCookie(res1.headers['set-cookie'] as string[])

  await request({ config: { url: url2, params: { _: now } }, cookie: cookie1 })
  await request({ config: { url: url3 } })
  const res4 = await request({ config: { url: url4 } })
  const session = (res4.data as string).split('; ')[1].split('=').pop()
}
