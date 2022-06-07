import * as cheerio from 'cheerio'

export function parsePreStudentPage(html: string): string {
  const $ = cheerio.load(html)

  const currentCode = $('.btn-info').toArray()[0].attribs.value as string

  return currentCode
}
