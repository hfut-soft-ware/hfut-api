import { IQuery } from '../server'
import request from '../shared/request'

export default function(query: IQuery) {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/schedule-table/timetable-layout?vpn-12-o1-jxglstu.hfut.edu.cn'

  const { id } = query.req.query
  if (!id) {
    return {
      status: 400,
      msg: '课表布局id不能为空',
    }
  }
  return request(url, {
    method: 'POST',
    data: {
      timeTableLayoutId: id,
    },
  }, query.cookie)
}
