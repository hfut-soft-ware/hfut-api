import { IQuery } from '../server'
import request from '../shared/request'

// TODO 完成评教
export default async function(query: IQuery) {
  const { req } = query
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/submit-survey?vpn-12-o1-jxglstu.hfut.edu.cn'

  await request(url, { method: 'post', data: req.query }, query.cookie)

  return {
    code: 200,
    msg: '评教成功',
  }
}
