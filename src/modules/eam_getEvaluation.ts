import { IQuery } from '../server'
import request from '../shared/request'

export default async function(query: IQuery) {
  let ids = query.req.query.ids as string | string[]

  await request(
    'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey',
    { maxRedirects: 1 },
    query.cookie,
  )

  if (!Array.isArray(ids)) {
    ids = [ids]
  }

  const result: any[] = []

  for await (const id of ids) {
    const url = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/start-survey/${id}/get-data?vpn-12-o1-jxglstu.hfut.edu.cn`
    const res = await request(url, {}, query.cookie)
    result.push(res.body)
  }

  return {
    code: 200,
    data: result,
  }
}
