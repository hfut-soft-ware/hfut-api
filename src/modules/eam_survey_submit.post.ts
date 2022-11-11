import { IQuery } from '../server'
import request from '../shared/request'

export default async function(query: IQuery) {
  const res = await request('http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey/submit-survey', {
    method: 'POST',
    data: query.req.body,
  }, query)
  return {
    code: 200,
    msg: '提交成功',
    data: res.body,
  }
}
