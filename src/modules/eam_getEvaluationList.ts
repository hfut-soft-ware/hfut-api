import { AxiosError } from 'axios'
import request from '../shared/request'
import { IQuery } from '../server'

export default async function(query: IQuery) {
  let id = query.req.query.id as string

  if (!id) {
    id = '174'
  }
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey'
  const ext = '/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/semester-index/'
  let studentCode = ''

  try {
    await request(url, {}, query)
  } catch (err) {
    studentCode = (err as AxiosError).response!.headers.location.replace(ext, '')
  }

  const dataUrl = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/${id}/search/${studentCode}?vpn-12-o1-jxglstu.hfut.edu.cn`
  const res = request(dataUrl, {}, query)

  return {
    code: 200,
    msg: '获取评教信息成功',
    data: res,
  }
}
