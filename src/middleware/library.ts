import request from '../shared/request'

export default async function libraryMiddleware(cookie: string) {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421f3f652d22f367d44300d8db9d6562d/cas/login?service=http://210.45.242.5:8080/reader/hwthau2.php'
  try {
    await request(url, {}, { cookie })
  } catch (err) {
    await request(url, { maxRedirects: 10 }, { cookie })
  }
}
