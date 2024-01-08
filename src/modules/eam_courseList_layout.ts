import { IQuery } from '../server'
import request from '../shared/request'
const url = 'http://jxglstu.hfut.edu.cn/eams5-student/ws/schedule-table/timetable-layout '

export default async function(query: IQuery) {
  const { id } = query.req.query
  if (!id) {
    return {
      code: 400,
      msg: '课表布局id不能为空',
    }
  }
  const { body } = await request(url, {
    method: 'POST',
    data: {
      timeTableLayoutId: +id,
    },
  }, query)
  return {
    code: 200,
    msg: '获取课表布局成功',
    data: body,
  }
}
