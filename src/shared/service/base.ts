import axios, { AxiosRequestConfig } from 'axios'

export const createInstance = (config: AxiosRequestConfig) => {
  return axios.create(config)
}

export const request = (config: AxiosRequestConfig) => {
  return axios.request(config)
}
