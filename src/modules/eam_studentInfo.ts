import request from '../shared/request'
import { IQuery } from '../server'

export default async function(query: IQuery) {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/student/home-page/students?vpn-12-o1-jxglstu.hfut.edu.cn'
  const res = await request(url, {}, query.cookie)

  return {
    code: 200,
    msg: '获取学生信息成功',
    data: res,
  }
}
