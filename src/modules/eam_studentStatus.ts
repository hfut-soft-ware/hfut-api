import { AxiosError } from 'axios'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { IQuery } from '../server'
import request from '../shared/request'
import { parsePreStudentPage } from '../shared/utils/parsePreStudentPage'

function parseDetail(doms: Cheerio<cheerio.Element>) {
  return doms.map((_, item) => {
    const $ = cheerio.load(item)
    const dlChildren = $('dl').children()
    return {
      title: $('h2').text(),
      detail: dlChildren.map((idx) => {
        if (idx % 2 === 0) {
          return {
            key: dlChildren.eq(idx).text(),
            value: dlChildren.eq(idx + 1).text().trim(),
          }
        }
        return null
      }).toArray().filter(item => item !== null),
    }
  }).toArray()
}

export default async function(query: IQuery) {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/student-info'
  let res = {} as any

  let code = ''
  try {
    const prePage = await request(url, { }, query)
    code = parsePreStudentPage(prePage.body)
  } catch (err) {
    code = (err as AxiosError).response!.headers.location.replace('/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/student-info/info/', '')
  } finally {
    res = await request(`https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/student-info/info/${code}`, { }, query)
  }

  const $ = cheerio.load(res.body)
  const baseInfoDom = $('.list-group').first().children('li')

  const baseInfo = baseInfoDom.filter((idx, item) => {
    const key = $(item).find('span[class=pull-left]').children('strong').text() as string
    const value = $(item).find('span').next().text() as string

    return key.trim().length > 0 && value.trim().length > 0
  }).map((index, item) => ({
    key: $(item).find('span[class=pull-left]').children('strong').text(),
    value: $(item).find('span').next().text() as string,
  }))

  const detailDoms = $('.col-sm-8').children('.info-page')

  return {
    msg: '获取学籍信息成功',
    data: {
      baseInfo: baseInfo.toArray(),
      detailInfo: parseDetail(detailDoms),
    },
    code: 200,
  }
}
