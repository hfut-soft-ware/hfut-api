import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'
import { parsePreStudentPage } from '../shared/utils/parsePreStudentPage'

export default async function(query: IQuery) {
  const firstUrl = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/program-completion-preview'

  const baseUrl = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/program-completion-preview/json'

  let res = {} as any

  try {
    const prePage = await request(firstUrl, {}, query)
    const code = parsePreStudentPage(prePage.body)
    res = await request(`${baseUrl}/${code}`, {}, query)
  } catch (err) {
    const code = (err as AxiosError).response!.headers.location.split('/')[5]
    const url = `${baseUrl}/${code}`
    res = await request(url, {}, query)
  }

  return {
    code: 200,
    msg: '获取培养方案成功',
    data: res.body,
  }
}
