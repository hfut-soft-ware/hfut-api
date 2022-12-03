import { load } from 'cheerio'
import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'
import { cardLogin } from '../shared/utils/cardLogin'

const url = 'http://172.31.248.20/accountcardUser.action'

function parser(data: string): object {
  const $ = load(data)
  const table = $('body table table table table')
  // 姓名
  const username = $('tr:nth-child(2) td:nth-child(2)', table)
    .text().trim().replace(' ', '')
  // 学号
  const studentCode = $('tr:nth-child(3) td:nth-child(4)', table)
    .text().trim().replace(' ', '')
  // 部门
  const department = $('tr:nth-child(8) td:nth-child(2)', table)
    .text().trim().replace(' ', '')
  // 余额
  const balance = $('tr:nth-child(12) td:nth-child(2)', table)
    .text().trim().replace(' ', '').split('元')[0]
  // 卡状态
  const cardStatus = $('tr:nth-child(11) td:nth-child(4)', table)
    .text().trim().replace(' ', '') === '正常'
  // 冻结状态
  const freezeStatus = $('tr:nth-child(11) td:nth-child(6)', table)
    .text().trim().replace(' ', '') !== '正常'
  // 挂失状态
  const lossStatus = $('tr:nth-child(12) td:nth-child(6)', table)
    .text().trim().replace(' ', '') !== '正常'

  return {
    username,
    studentCode,
    department,
    balance,
    cardStatus,
    freezeStatus,
    lossStatus,
  }
}

export default async function(query: IQuery) {
  const isCardCookie = query.req.query.isCardCookie || 'true'
  const payload = { cookie: query.cookie }
  if (isCardCookie === 'false') {
    const { cookie } = await cardLogin(query)
    payload.cookie = cookie
  }
  let html = ''
  try {
    const res = await request(url, {}, payload)
    html = res.body
  } catch (err) {
    const code = (err as AxiosError).response?.status
    if (code === 302) {
      return {
        code: 401,
        msg: (err as AxiosError).message,
      }
    }
    return {
      code: 500,
      msg: (err as AxiosError).message,
    }
  }
  return {
    code: 200,
    msg: '获取获取一卡通信息成功',
    data: {
      ...parser(html),
      cardCookie: payload.cookie,
    },
  }
}
