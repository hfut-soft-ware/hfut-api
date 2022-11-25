import { AxiosError } from 'axios'
import { IQuery } from '../../server'
import request from '../../shared/request'

export default async function(query: IQuery) {
  const data = query.req.body

  const refer = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/start-survey/${data.lessonSurveyTaskAssoc}?REDIRECT_URL=%2Ffor-std%2Flesson-survey%2Fsemester-index%2F${data.studentId}`
  const res = await request('https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/check-can-submit?vpn-12-o1-jxglstu.hfut.edu.cn', {
    method: 'POST',
    data,
    headers: {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,ja;q=0.5,hi;q=0.4',
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'pragma': 'no-cache',
      'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      'Referer': refer,
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
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
    query.cookie = `show_vpn=1; show_faq=0; ${query.cookie}; refresh=1`
    const { body } = await request('https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/submit-survey?vpn-12-o1-jxglstu.hfut.edu.cn', {
      method: 'POST',
      data,
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,ja;q=0.5,hi;q=0.4',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'origin': 'https://webvpn.hfut.edu.cn',
        'x-requested-with': 'XMLHttpRequest',
        'referer': refer,
        'cookie': query.cookie,
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
