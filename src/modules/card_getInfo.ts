import * as cheerio from 'cheerio'

import { IQuery } from '../server'
import request from '../shared/request'

const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accountcardUser.action'

function parser(data: string): object {
  const $ = cheerio.load(data)
  // 姓名
  let username = $('body table table table table tr:nth-child(2) td:nth-child(2)')
    .text().trim().replace(' ', '')
  // 学号
  let studentCode = $('body table table table table tr:nth-child(3) td:nth-child(4)')
    .text().trim().replace(' ', '')
  // 部门
  let department = $('body table table table table tr:nth-child(8) td:nth-child(2)')
    .text().trim().replace(' ', '')
  // 余额
  let balance = $('body table table table table tr:nth-child(12) td:nth-child(2)')
    .text().trim().replace(' ', '').split('元')[0]
  // 卡状态
  let cardStatus = $('body table table table table tr:nth-child(11) td:nth-child(4)')
    .text().trim().replace(' ', '') === '正常'
  // 冻结状态
  let freezeStatus = $('body table table table table tr:nth-child(11) td:nth-child(6)')
    .text().trim().replace(' ', '') !== '正常'
  // 挂失状态
  let lossStatus = $('body table table table table tr:nth-child(12) td:nth-child(6)')
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
  const res = await request(url, {}, query.cookie)
  return {
    code: 200,
    msg: '获取获取一卡通信息成功',
    data: parser(res.body as string),
  }
}
