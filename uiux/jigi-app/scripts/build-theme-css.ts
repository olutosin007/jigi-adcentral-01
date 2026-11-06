import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderThemeCss, THEME_CSS_PATH } from '../src/design-system/theme-css'

const target = resolve(process.cwd(), THEME_CSS_PATH)
writeFileSync(target, renderThemeCss())
console.log(`Wrote ${THEME_CSS_PATH}`)
