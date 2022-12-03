import { load } from 'cheerio'
import request from '../shared/request'
import { IQuery } from '../server'
import { libraryLogin } from '../shared/utils/library'

const url = 'http://210.45.242.5:8080/reader/book_lst.php'

interface BorrowBook {
  name: string
  barcodeNumber: string
  borrowTime: string
  returnTime: string
  collectionPlace: string
}

export default async function(query: IQuery) {
  const isCardCookie = query.req.query.isLibraryCookie || 'true'
  if (isCardCookie === 'false') {
    const { cookie } = await libraryLogin(query)
    query.cookie = cookie
  }
  const { body } = await request(url, {
    validateStatus(status) {
      return status >= 200 || status === 302
    },
  }, query)
  return {
    code: 200,
    msg: '获取当前借阅成功',
    data: {
      borrowBook: parseHTML(body),
      libraryCookie: query.cookie,
    },

  }
}

function parseHTML(html: string) {
  const $ = load(html)
  const tds = $('.table_line tr').filter(i => i > 0)
  const borrowBook: BorrowBook[] = []
  tds.each((_, el) => {
    borrowBook.push({
      barcodeNumber: $('td[width="10%"]', el).text(),
      name: $('td[width="35%"]', el).text(),
      borrowTime: $('td:nth-child(3)').text(),
      returnTime: $('td:nth-child(4)').text().trim(),
      collectionPlace: $('td:nth-child(6)').text(),
    })
  })
  return borrowBook
}
