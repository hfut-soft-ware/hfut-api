import * as cheerio from 'cheerio'

export function parsePreStudentPage(html: string): string {
  const $ = cheerio.load(html)

  const infoPages = $('.info-page')

  let undergraduateIdx = 0

  // 确保拿到的是预科生本科阶段的数据
  infoPages.toArray().forEach((page, index) => {
    const studentType = $(page).children('dl').children('dd').eq(4).text()

    if (studentType.includes('本科')) {
      undergraduateIdx = index
    }
  })

  const currentCode = $('.btn-info').toArray()[undergraduateIdx].attribs.value as string

  return currentCode
}
