import { AxiosError } from 'axios'
import { IQuery } from '../../server'
import request from '../../shared/request'

export default async function(query: IQuery) {
  const data = query.req.body

  const res = await request('https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/check-can-submit?vpn-12-o1-jxglstu.hfut.edu.cn', {
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
    const { body } = await request('https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/submit-survey?vpn-12-o1-jxglstu.hfut.edu.cn', {
      method: 'POST',
      data,
      headers: {
        cookie: query.cookie,
      },
    }, query)
    return {
      code: 200,
      msg: '提交成功',
      data: body,
    }
  } catch (error) {
    return {
      code: 500,
      msg: (error as AxiosError).message,
      data: (error as AxiosError).response?.data,
    }
  }
}
