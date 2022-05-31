import * as Buffer from 'buffer'
import cheerio from 'cheerio'
import iconv from 'iconv-lite'

import { IQuery } from '../server'
import request from '../shared/request'

const url1 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accounthisTrjn1.action'
const url2 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accounthisTrjn2.action'
const url3 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accounthisTrjn3.action'
const url4 = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accountconsubBrows.action'

function parserFlowWater(data: string): object {
  let consumerList = []

  const $ = cheerio.load(data)

  let i = 2

  while ($(`#tables tbody tr:nth-child(${i})`).length) {
    // 交易发生时间
    const time = $(`#tables tbody tr:nth-child(${i}) td:nth-child(1)`).text().trim()

    if (time.match('本次查询')) {
      break
    }

    // 交易类型
    const consumerType = $(`#tables tbody tr:nth-child(${i}) td:nth-child(4)`).text().trim()

    // 商户名称
    const merchantName = $(`#tables tbody tr:nth-child(${i}) td:nth-child(5)`).text().trim().replace(' ', '')

    // 交易额
    const amount = $(`#tables tbody tr:nth-child(${i}) td:nth-child(6)`).text().trim()

    // 现有余额
    const balance = $(`#tables tbody tr:nth-child(${i}) td:nth-child(7)`).text().trim()

    // 次数
    const index = $(`#tables tbody tr:nth-child(${i}) td:nth-child(8)`).text().trim()

    // 状态
    const status = $(`#tables tbody tr:nth-child(${i}) td:nth-child(9)`).text().trim()

    // 说明
    const desc = $(`#tables tbody tr:nth-child(${i}) td:nth-child(10)`).text().trim().replace(' ', '')

    consumerList.push({
      time,
      consumerType,
      merchantName,
      amount,
      balance,
      index,
      status,
      desc,
    })
    i++
  }

  // 学号
  const studentCode = $('#tables tbody tr:nth-child(2) td:nth-child(2)').text().trim()

  // 姓名
  const username = $('#tables tbody tr:nth-child(2) td:nth-child(3)').text().trim().replace(' ', '')
  // 其他信息
  const info = $('#tables tbody tr:nth-last-child(1) td').text()
  let match = `${info.match('共[0-9]+页')}`
  const pageNum = parseInt(match.slice(1, match.length - 1))

  match = `${info.match('当前第[0-9]+页')}`
  const index = parseInt(match.slice(3, match.length - 1))

  const count = parseInt(`${(`${info.match('[0-9]+次交易')}`).match('[0-9]+')}`)

  const grossAmount = `${(`${info.match('额为:[0-9.]+')}`).match('[0-9.]+')}`

  return {
    list: consumerList,
    studentCode,
    username,
    pageNum,
    count,
    grossAmount,
    index,
  }
}

function parserPageNum(page: any): number {
  const pageNum = parseInt(page || '1')
  return pageNum >= 1 ? pageNum : 1
}

export default async function(query: IQuery) {
  const { req } = query
  const account = req.query.account as string || '158092'
  const type = req.query.type as string || 'all'
  const startDate = req.query.startDate as string
  const endDate = req.query.endDate as string

  const pageNum = parserPageNum(req.query.pageNum)

  if (!startDate || !endDate) {
    return {
      code: 400,
      msg: '开始时间或结束时间不为空不能为空',
    }
  }

  await request(url1, {
    method: 'POST',
    maxRedirects: 10,
    responseType: 'arraybuffer',
    data: `account=${account}&inputObject=${type}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  }, query.cookie)

  await request(url2, {
    method: 'POST',
    maxRedirects: 10,
    responseType: 'arraybuffer',
    data: `inputStartDate=${startDate}&inputEndDate=${endDate}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  }, query.cookie)

  let res2
  res2 = await request(url3, {
    method: 'POST',
    maxRedirects: 10,
    responseType: 'arraybuffer',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  }, query.cookie)

  if (pageNum !== 1) {
    res2 = await request(url4, {
      method: 'POST',
      maxRedirects: 10,
      responseType: 'arraybuffer',
      data: `inputStartDate=${startDate}&inputEndDate=${endDate}&pageNum=${pageNum}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    }, query.cookie)
  }

  res2 = iconv.decode(res2.body as Buffer, 'gbk')
  const data = parserFlowWater(res2 as string)

  return {
    code: 200,
    msg: '获取一卡通流水信息成功',
    data,
  }
}
