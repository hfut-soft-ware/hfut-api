import cheerio from 'cheerio'
import { IQuery } from '../server'
import request from '../shared/request'

const baseUrl = 'https://webvpn.hfut.edu.cn/http-8080/77726476706e69737468656265737421a2a611d2736526022a5ac7f9'

const url = `${baseUrl}/reader/book_lst.php`

export default async function(query: IQuery) {
  const res = await request(url, { method: 'get', maxRedirects: 5 }, query)

  const parserBookList = (body: string) => {
    const $ = cheerio.load(body)

    const result = []
    let i = 2

    while ($(`.table_line tr:nth-child(${i})`).length) {
      const id = $(`.table_line tr:nth-child(${i}) td:nth-child(1)`).text()

      const [name, author] = $(`.table_line tr:nth-child(${i}) td:nth-child(2)`).text().split('/')
        .map((value) => { return value.trim().replace(' ', '') })

      const startDate = $(`.table_line tr:nth-child(${i}) td:nth-child(3)`).text().trim().replace(' ', '')

      const endDate = $(`.table_line tr:nth-child(${i}) td:nth-child(4)`).text().trim().replace(' ', '')

      const count = $(`.table_line tr:nth-child(${i}) td:nth-child(5)`).text().trim().replace(' ', '')

      const site = $(`.table_line tr:nth-child(${i}) td:nth-child(6)`).text().trim().replace(' ', '')

      const desc = $(`.table_line tr:nth-child(${i}) td:nth-child(7)`).text().trim().replace(' ', '')

      result.push({
        id,
        name,
        author,
        startDate,
        endDate,
        count,
        site,
        desc,
      })

      i++
    }
    return result
  }

  return {
    code: 200,
    msg: '获取图书馆当前借阅成功',
    data: parserBookList(res.body),
  }
}
