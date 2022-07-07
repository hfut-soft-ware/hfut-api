import * as cheerio from 'cheerio'
import { query } from 'express'
import request from '../shared/request'

interface SchoolBusItem {
  runRange: string[]
  startTime: string
  startPlace: string
  passPlace: string | null
  count: string
}

const url = 'https://www.hfut.edu.cn/xcxx.htm'

function parseSchoolBusInfo(html: string) {
  const $ = cheerio.load(html)
  const trList = $('#vsb_content tr')

  let key = 'weekday'
  const schoolBusMap: Record<string, SchoolBusItem[]> = {
    [key]: [],
  }
  trList.each((_, tr) => {
    const text = $(tr).text()
    if (text.includes('周六')) {
      key = 'sat'
      schoolBusMap[key] = []
      return
    }
    if (text.includes('周日')) {
      key = 'sun'
      schoolBusMap[key] = []
      return
    }
    if (text.includes('发车时间') || text.includes('周一至周五')) {
      return
    }
    const textArr = text.split('\n')
    schoolBusMap[key].push({
      runRange: textArr[1].trim().split('—'),
      startTime: textArr[2].trim(),
      startPlace: textArr[3].trim(),
      passPlace: textArr[4].trim(),
      count: textArr[5].trim(),
    })
  })
  return schoolBusMap
}

export default async function() {
  const res = await request(url, {})
  return {
    msg: '获取校车信息成功',
    code: 200,
    data: parseSchoolBusInfo(res.body),
  }
}
