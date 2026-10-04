import { PNG } from 'pngjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'LOGO LINK PRODUCTIVE.png')
const OUT = path.join(__dirname, '..', 'public', 'logo.png')

const data = fs.readFileSync(SRC)
const png = PNG.sync.read(data)

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) * 4
    const r = png.data[idx]
    const g = png.data[idx + 1]
    const b = png.data[idx + 2]
    // Piksel putih/hampir putih → transparan
    if (r > 230 && g > 230 && b > 230) {
      png.data[idx + 3] = 0
    }
  }
}

fs.writeFileSync(OUT, PNG.sync.write(png))
console.log('✅ Logo background dihapus →', OUT)
