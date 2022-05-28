import cheerio from 'cheerio'

import { IQuery } from '../server'
import request from '../shared/request'

const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accountcardUser.action'

function removeSpace(str: string): string {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== ' ') {
      result += str[i]
    }
  }
  return result
}

function parser(data: string): object {
  const $ = cheerio.load(data)
  // 姓名
  let username = removeSpace($('body table table table table tr:nth-child(2) td:nth-child(2)').text().trim())
  // 学号
  let stu_code = removeSpace($('body table table table table tr:nth-child(3) td:nth-child(4)').text().trim())
  // 部门
  let department = removeSpace($('body table table table table tr:nth-child(8) td:nth-child(2)').text().trim())
  // 余额
  let balance = removeSpace($('body table table table table tr:nth-child(12) td:nth-child(2)').text().trim()).split('元')[0]
  // 卡状态
  let card_status = removeSpace($('body table table table table tr:nth-child(11) td:nth-child(4)').text().trim()) === '正常'
  // 冻结状态
  let freeze_status = removeSpace($('body table table table table tr:nth-child(11) td:nth-child(6)').text().trim()) !== '正常'
  // 挂失状态
  let loss_status = removeSpace($('body table table table table tr:nth-child(12) td:nth-child(6)').text().trim()) !== '正常'

  return {
    username,
    stu_code,
    department,
    balance,
    card_status,
    freeze_status,
    loss_status,
  }
}

export default async function(query: IQuery) {
  const res = await request(url, {}, query.cookie)
  return {
    code: 200,
    msg: '获取一卡通信息',
    data: parser(res.body as string),
  }
}
