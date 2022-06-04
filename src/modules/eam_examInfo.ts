import * as cheerio from 'cheerio'
import { IQuery } from '../server'
import request from '../shared/request'

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

export default async function(query: IQuery) {
  const redirectUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/exam-arrange'
  const res = await request(redirectUrl, { maxRedirects: 1 }, query.cookie)

  return {
    msg: '获取考试信息成功',
    code: 200,
    data: parseExamInfo(res.body),
  }
}
