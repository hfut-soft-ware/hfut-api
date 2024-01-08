import { load } from 'cheerio'
import iconv from 'iconv-lite'

export function parserFlowWater(body: Buffer): object {
  const data = iconv.decode(body, 'gbk')
  let consumerList = []

  const $ = load(data)
  const table = $('#tables tbody')

  let i = 2

  while ($(`tr:nth-child(${i})`, table).length) {
    const tr = $(`tr:nth-child(${i})`, table)
    if (tr.hasClass('bl')) {
      i++
      continue
    }
    // 交易发生时间
    const time = $('td:nth-child(1)', tr).text().trim()

    if (time.match('本次查询')) {
      break
    }

    // 交易类型
    const consumerType = $('td:nth-child(4)', tr).text().trim()

    // 商户名称
    const merchantName = $('td:nth-child(5)', tr)
      .text()
      .trim()
      .replace(' ', '')

    // 交易额
    const amount = $('td:nth-child(6)', tr).text().trim()

    // 现有余额
    const balance = $('td:nth-child(7)', tr).text().trim()

    // 次数
    const index = $('td:nth-child(8)', tr).text().trim()

    // 状态
    const status = $('td:nth-child(9)', tr).text().trim()

    // 说明
    const desc = $('td:nth-child(10)', tr)
      .text()
      .trim()
      .replace(' ', '')

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

  // 其他信息
  const info = $('tr:nth-last-child(1) td', table).text()
  let match = `${info.match('共[0-9]+页')}`
  const pageNum = parseInt(match.slice(1, match.length - 1))

  match = `${info.match('当前第[0-9]+页')}`
  const index = parseInt(match.slice(3, match.length - 1))

  const count = parseInt(`${`${info.match('[0-9]+次交易')}`.match('[0-9]+')}`)

  const grossAmount = `${`${info.match('额为:-?[0-9.]+')}`.match('-?[0-9.]+')}`

  return {
    list: consumerList,
    pageNum,
    count,
    grossAmount,
    index,
  }
}

export function parserAccount(body: string) {
  const $ = load(body)
  return $('#account option').attr('value')
}
