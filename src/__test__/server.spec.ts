import { getRoute } from '../server'

describe('getRoute', () => {
  it('should be equal as {/getStudentInfo}', () => {
    const routeSpy = '/getStudentInfo'
    const route = getRoute('get_student_info')
    expect(route).toEqual(routeSpy)
  })
})
