import * as cheerio from 'cheerio'
import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'
import { parsePreStudentPage } from '../shared/utils/parsePreStudentPage'

function parseExamInfo(html: string) {
  const $ = cheerio.load(html)
  const tbody = $('tbody')
  const tr = tbody.find('tr')
  return tr.map((_, tr) => {
    const info = $(tr).children().map((_, td) => $(td).text()).toArray()

    const date = (info[1] as string).split(' ')

    const day = date[0]

    return {
      name: info[0].trim().replace(' ', ''),
      startTime: new Date(`${day} ${date[1].split('~')[0]}`).getTime(),
      endTime: new Date(`${day} ${date[1].split('~')[1]}`).getTime(),
      position: info[2],
    }
  }).toArray()
}

const redirectUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/exam-arrange'
const baseUrl = `${redirectUrl}/info`

export default async function(query: IQuery) {
  let res = {} as any
  try {
    const prePage = await request(redirectUrl, {}, query.cookie)
    const code = parsePreStudentPage(prePage.body)
    const page = await request(`${baseUrl}/${code}`, { maxRedirects: 1 }, query.cookie)
    res = page
  } catch (err) {
    const code = (err as AxiosError).response!.headers.location.replace('/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/exam-arrange/info/', '')
    const url = `${baseUrl}/${code}`
    res = await request(url, { maxRedirects: 1 }, query.cookie)
  }

  return {
    msg: '获取考试信息成功',
    code: 200,
    data: parseExamInfo(res.body),
  }
}
