import { IQuery } from '../server'

export default function(query: IQuery) {
  const id = query.req.query.id
  const url = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/start-survey/${id}/get-data?vpn-12-o1-jxglstu.hfut.edu.cn`
}
