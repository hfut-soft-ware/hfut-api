import { Semester } from '../constant'

export function getSemesterCode(semester: string) {
  return Semester.find(item => item.name === semester)?.code
}

export function transformDetailScore(detail: string) {
  if (detail.search('待评教') !== -1) {
    return []
  }
  return detail.split('<br>').map((item) => {
    const res = item.split(':')
    return {
      type: res[0],
      score: res[1],
    }
  })
}
