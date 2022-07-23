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

const redirectUrl = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/exam-arrange'

export default async function(query: IQuery) {
  let res = {} as any
  try {
    const prePage = await request(redirectUrl, { }, query)
    const code = parsePreStudentPage(prePage.body)
    const page = await request(`${redirectUrl}/info/${code}`, { maxRedirects: 1 }, query)
    res = page
  } catch (err) {
    const code = (err as AxiosError).response!.headers.location.split('/')[5]
    const url = `${redirectUrl}/info/${code}`
    res = await request(url, { maxRedirects: 1 }, query)
  }

  return {
    msg: '获取考试信息成功',
    code: 200,
    data: parseExamInfo(res.body),
  }
}
