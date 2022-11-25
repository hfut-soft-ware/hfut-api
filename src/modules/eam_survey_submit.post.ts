import axios, { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'

const url1 = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey'

export default async function(query: IQuery) {
  const data = query.req.body
  const studentId = data.studentId
  delete data.studentId
  try {
    await request(url1, { maxRedirects: 5, method: 'get' }, { cookie: query.cookie })
  } catch {}
  await request('http://localhost:8082/eam/survey/getList', {}, query)
  const { cookie } = await request(`http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey/start-survey/${data.lessonSurveyTaskAssoc}?REDIRECT_URL=%2Ffor-std%2Flesson-survey%2Fsemester-index%2F${studentId}`, {}, query)

  console.log(cookie)
  query.cookie = `${query.cookie}; ${cookie![0].split(';')[0]}; ${cookie![1].split(';')[0]}`

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
    const res = await axios({
      url: 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey/submit-survey',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,en-GB;q=0.5,hi;q=0.4',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'pragma': 'no-cache',
        'proxy-connection': 'keep-alive',
        'cookie': query.cookie,
        'x-requested-with': 'XMLHttpRequest',
        'Referer': `http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-survey/start-survey/${data.lessonSurveyTaskAssoc}?REDIRECT_URL=%2Ffor-std%2Flesson-survey%2Fsemester-index%2F${studentId}`,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      data,
      method: 'POST',
    })
    return {
      code: 200,
      msg: '提交成功',
      data: res.data,
    }
  } catch (error) {
    return {
      code: 500,
      msg: (error as AxiosError).message,
      data: (error as AxiosError).response?.data,
    }
  }
}
