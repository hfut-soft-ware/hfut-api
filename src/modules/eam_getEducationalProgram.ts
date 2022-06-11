import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'
import { parsePreStudentPage } from '../shared/utils/parsePreStudentPage'

export default async function(query: IQuery) {
  const firstUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/program-completion-preview'

  const baseUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/program-completion-preview/json/'

  let res = {} as any

  try {
    const prePage = await request(firstUrl, {}, query.cookie)
    const code = parsePreStudentPage(prePage.body)
    res = await request(`${baseUrl}/${code}`, {}, query.cookie)
  } catch (err) {
    const code = (err as AxiosError).response!.headers.location.replace('/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/program-completion-preview/info/', '')
    const url = `${baseUrl}/${code}`
    res = await request(url, {}, query.cookie)
  }

  return {
    code: 200,
    msg: '获取培养方案成功',
    data: res.body,
  }
}
