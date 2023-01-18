import { load } from 'cheerio'
import { IQuery } from '../server'
import request from '../shared/request'
import { getUniqueId } from '../shared/utils/index'

const baseUrl = 'http://jxglstu.hfut.edu.cn'

export default async function(query: IQuery) {
  const { success, uniqueId } = await getUniqueId(query)
  if (!success) {
    return {
      code: 302,
      msg: 'on cookie or cookie expired',
      data: {},
    }
  }
  const { body } = await request(`${baseUrl}/eams5-student/for-std/lesson-survey/semester-index/${uniqueId}`, {}, query)
  return {
    code: 200,
    msg: 'ok',
    data: parseHTML(body),
  }
}
function parseHTML(html: string) {
  const $ = load(html)
  const selectELement = $('#semester')
  const semesters = $('option', selectELement).map((_i, el) => {
    return {
      semesterName: $(el).text(),
      code: $(el).attr('value'),
    }
  }).get()
  return {
    semesters,
    currentSemester: {
      semesterName: $('option[selected]', selectELement).text(),
      code: $('option[selected]', selectELement).attr('value'),
    },
  }
}
