import { AxiosError } from 'axios'
import * as cheerio from 'cheerio'
import request from '../shared/request'
import { IQuery } from '../server'
import { getSemesterCode, transformDetailScore } from '../shared/utils/semster'

function parseScore(html: string) {
  const $ = cheerio.load(html)

  const rows = $('.row')
  return rows.map((_, row) => {
    return $(row).map((_, el) => {
      const semester = $(el).find('.col-sm-12').first().find('h3').text()
      const semesterCode = getSemesterCode(semester)

      const scoreList = $(el).find('tbody').find('tr').map((_, tr) => {
        const list = $(tr).find('td').map((idx, td) => {
          if (idx < 6) {
            return $(td).text()
          }

          return $(td).html()
        }).toArray()

        return {
          name: list[0],
          lessonId: list[1],
          teachingClassId: list[2],
          credit: list[3],
          gpa: list[4],
          score: list[5],
          detail: transformDetailScore(list[6]),
        }
      }).toArray()
      return {
        semester,
        semesterCode,
        score: scoreList,
      }
    }).toArray()
  }).toArray()
}

export default async function(query: IQuery) {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/grade/sheet'

  const semester = query.req.query.semester || ''

  let code = ''
  try {
    await request(url, { }, query.cookie)
  } catch (err) {
    code = (err as AxiosError).response!.headers.location.replace('/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/grade/sheet/semester-index/', '')
  }

  const iframeUrl = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/grade/sheet/info/${code}?semester=${semester}`

  const html = await request(iframeUrl, {}, query.cookie)

  return {
    code: 200,
    msg: 'success',
    data: parseScore(html.body),
  }
}
