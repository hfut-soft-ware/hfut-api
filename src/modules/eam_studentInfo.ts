import { AxiosError } from 'axios'
import * as cheerio from 'cheerio'
import request from '../shared/request'
import { IQuery } from '../server'
import { parsePreStudentPage } from '../shared/utils/parsePreStudentPage'

import type { IAnswer } from '../shared/types'

const url = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/student-info'

const parseStudentInfo = (body: string) => {
  const $ = cheerio.load(body)

  const studentId = $('#base-info ul.list-group li:nth-child(3) span:nth-child(2)').text().trim()
  const usernameZh = $('#base-info ul.list-group li:nth-child(4) span:nth-child(2)').text().trim()
  const usernameEn = $('#base-info ul.list-group li:nth-child(5) span:nth-child(2)').text().trim()
  const sex = $('#base-info ul.list-group li:nth-child(6) span:nth-child(2)').text().trim()

  const info = $('#base-info .info-page dl')
    .children('dd')
    .map((index, el) => {
      return cheerio.load(el).text()
    })

  const graduateDate = () => {
    const node = $('#graduate-info dl')
    const keys = node.children('dt').map((index, el) => {
      return cheerio.load(el).text()
    }).toArray()

    const values = node.children('dd') // 存在匹配不到，位置不是固定的
      .map((index, el) => {
        return cheerio.load(el).text()
      }).toArray()

    // 预计毕业日期 位置可能不是固定的
    const result = values.filter((values, index) => {
      return keys[index].includes('预计毕业日期')
    })

    return result.length ? result[0] : '2000-00-00'
  }

  return {
    studentId,
    usernameEn,
    usernameZh,
    sex,
    cultivateType: info[0],
    department: info[1],
    grade: info[2],
    level: info[3],
    studentType: info[4],
    major: info[6],
    class: info[8],
    campus: info[9],
    status: info[10],
    length: info[18],
    enrollmentDate: info[19],
    graduateDate: graduateDate(),
  }
}

export default async function(query: IQuery) {
  let code = ''
  try {
    await request(url, {}, query)
  } catch (err) {
    code = (err as AxiosError).response!.headers.location.split('/')[5]
  }
  // 处理预科生
  if (!code) {
    const preStdPage = await request(url, {}, query)
    code = parsePreStudentPage(preStdPage.body)
  }

  const url1 = `${url}/info/${code}`
  let res = {} as IAnswer
  try {
    res = await request(url1, { }, query)
  } catch (err) {
    return {
      code: 400,
      msg: (err as AxiosError).message,
    }
  }
  const info = parseStudentInfo(res.body as string)

  return {
    code: 200,
    msg: '获取学生信息成功',
    data: {
      studentCode: code,
      ...info,
    },
  }
}
