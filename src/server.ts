import * as fs from 'fs'
import { Express } from 'express'

export async function setupServer(app: Express) {
  let files: string[] = []

  await fs.promises.readdir('./src/modules').then((res) => {
    files = res
  }).catch((err) => {
    console.log('An error occurred when read dir\n', err)
  })

  files.forEach((file) => {
    if (file.endsWith('.ts')) {
      const filename = file.replace('.ts', '')
      const module = require(`./modules/${file}`).default()
    }
  })
}
