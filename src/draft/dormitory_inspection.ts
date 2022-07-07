import axios from 'axios'
import * as cheerio from 'cheerio'

const url = 'http://39.106.82.121/query/getStudentScore'

export async function dormitoryInspection({ studentCode }: { studentCode: string }) {
  const res = await axios.post(url, { student_code: studentCode })
  const $ = cheerio.load(res.data)

  const pushed = []
  const processed = ($('body').html() as string).split('\n').map(item => item.trim()).filter(item => item.length > 0 && item !== '--')

  const weekInfo = {
    teachingWeek: 0,
    totalScore: 0,
    bedInfo: [{
      bedNumber: 0,
      score: 0,
    }],
  }
  const weeksData: typeof weekInfo[] = []
  for (let time = 0; time < processed.length / 11; time++) {
    const payload: typeof weekInfo = Object.create(null)
    for (const item of processed.slice(time * 11, (time + 1) * 11)) {
      console.log(item)
    }
  }
}
