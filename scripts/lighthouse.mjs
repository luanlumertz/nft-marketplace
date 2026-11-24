import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { platform, release, cpus, totalmem } from 'node:os'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const { values } = parseArgs({ options: {
  runs: { type: 'string', default: '3' },
  profile: { type: 'string', default: 'all' },
  page: { type: 'string', default: 'all' },
} })
const runs = Number(values.runs)
if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs deve ser um inteiro positivo.')
if (!['all', 'mobile', 'desktop'].includes(values.profile)) throw new Error('--profile: all, mobile ou desktop.')
if (!['all', 'home', 'detail'].includes(values.page)) throw new Error('--page: all, home ou detail.')

const pages = { home: '/', detail: '/nfts/emerald-ape-042' }
const profiles = values.profile === 'all' ? ['mobile', 'desktop'] : [values.profile]
const selectedPages = values.page === 'all' ? Object.entries(pages) : [[values.page, pages[values.page]]]
const outputDirectory = `artifacts/lighthouse/${new Date().toISOString().replaceAll(':', '-')}`
await mkdir(outputDirectory, { recursive: true })

const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true, open: false } })
let chrome
const measurements = []

try {
  chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
  })
  for (const [pageName, path] of selectedPages) {
    for (const profile of profiles) {
      for (let run = 1; run <= runs; run++) {
        console.log(`Lighthouse: ${pageName}, ${profile}, ${run}/${runs}`)
        const result = await lighthouse(`http://127.0.0.1:4173${path}`, {
          port: chrome.port,
          output: ['html', 'json'],
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        }, profile === 'desktop' ? desktopConfig : undefined)
        if (!result || result.lhr.runtimeError) throw new Error(result?.lhr.runtimeError?.message ?? 'Auditoria sem resultado.')
        const filename = `${outputDirectory}/${pageName}-${profile}-${run}`
        await writeFile(`${filename}.html`, result.report[0])
        await writeFile(`${filename}.json`, result.report[1])
        measurements.push({
          page: pageName, profile, run,
          lighthouseVersion: result.lhr.lighthouseVersion,
          userAgent: result.lhr.userAgent,
          scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)])),
          metrics: Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map((key) => [key, result.lhr.audits[key].numericValue])),
        })
      }
    }
  }

  const median = (numbers) => {
    const ordered = [...numbers].sort((left, right) => left - right)
    const middle = Math.floor(ordered.length / 2)
    return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2
  }
  const medians = selectedPages.flatMap(([pageName]) => profiles.map((profile) => {
    const group = measurements.filter((entry) => entry.page === pageName && entry.profile === profile)
    return {
      page: pageName, profile,
      scores: Object.fromEntries(Object.keys(group[0].scores).map((key) => [key, median(group.map((entry) => entry.scores[key]))])),
      metrics: Object.fromEntries(Object.keys(group[0].metrics).map((key) => [key, median(group.map((entry) => entry.metrics[key]))])),
    }
  }))
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
  const summary = {
    generatedAt: new Date().toISOString(), runs, medians, measurements,
    environment: {
      node: process.version, platform: platform(), release: release(),
      cpu: cpus()[0]?.model, memoryGiB: Math.round(totalmem() / 1024 ** 3),
      playwright: lock.packages['node_modules/@playwright/test'].version,
      vite: lock.packages['node_modules/vite'].version,
      mocks: 'Cenário padrão MSW, build otimizado, assets e fontes locais.',
      throttling: 'Configuração padrão Lighthouse mobile/desktop; medições sequenciais na mesma máquina.',
    },
  }
  await writeFile(`${outputDirectory}/summary.json`, JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(medians, null, 2))
  console.log(`Relatórios: ${outputDirectory}`)
} finally {
  await chrome?.kill()
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
}
