import type { ServerFunction } from '@/shared/types'

const login: ServerFunction = async(query) => {
  return {
    code: 200,
    msg: 'success',
  }
}

export default login
