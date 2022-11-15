import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'

export default async function(query: IQuery) {
  const data = query.req.body
  const { cookie } = await request(`http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey/start-survey/${data.lessonSurveyTaskAssoc}?REDIRECT_URL=%2Ffor-std%2Flesson-survey%2Fsemester-index%2F${data.studentId}`, {}, query)
  delete data.studentId

  query.cookie = `${query.cookie}; ${cookie![0].split(';')[0]}`

  const res = await request('http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey/check-can-submit', {
    method: 'POST',
    data,
  }, query)
  const validateResult = res.body.validateResult
  if (!validateResult.passed) {
    return {
      code: 400,
      msg: '数据错误',
      data: validateResult,
    }
  }

  try {
    const { body } = await request('http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey/submit-survey', {
      method: 'POST',
      data,
      headers: {
        cookie: query.cookie,
      },
      maxRedirects: 5,
    }, query)
    return {
      code: 200,
      msg: '提交成功',
      data: body,
    }
  } catch (error) {
    console.log((error as AxiosError).request.headers.cookie)
    return {
      code: 500,
      msg: (error as AxiosError).message,
      data: (error as AxiosError).response?.data,
    }
  }
}
