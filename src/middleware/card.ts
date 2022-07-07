import request from '../shared/request'

export default async function cardMiddleware(cookie: string) {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=http://172.31.248.20/ahdxdrPortalHome.action'
  try {
    await request(url, {}, { cookie })
  } catch (err) {
    await request(url, { maxRedirects: 5 }, { cookie })
  }
}
