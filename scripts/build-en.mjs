// Erzeugt aus index.html die englische Fassung index.en.html, deren Head und
// sichtbarer Inhalt schon ohne JavaScript Englisch sind (für Crawler unter ?lang=en).
// nginx liefert sie für /datenschutz/?lang=en aus; das Sprach-Skript der Seite
// bleibt unverändert und schaltet wie bisher um.
//
//   node scripts/build-en.mjs          → schreibt index.en.html
//   node scripts/build-en.mjs --check  → Fehler, wenn index.en.html veraltet ist
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../', import.meta.url)
const PAGE_URL = 'https://kodinitools.com/datenschutz/'

export const EN = {
  title: 'Privacy Policy – KodiniTools',
  description:
    'Privacy policy of KodiniTools: transparent information on how your data is collected, processed, stored and deleted under the GDPR and the Swiss FADP – client-side vs. server-side processing, your rights and contact.',
  ogDescription:
    'Transparent information on how your data is processed under the GDPR and the Swiss FADP – client-side vs. server-side processing, your rights and contact.',
  twitterDescription:
    'Transparent information on how your data is processed under the GDPR and the Swiss FADP.',
}

const escapeAttr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Ersetzt genau einen Treffer; sonst Abbruch (lieber roter Build als falscher Head). */
function replaceOnce(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, 'g')) ?? []
  if (matches.length !== 1) {
    throw new Error(`build-en: ${label} kommt ${matches.length}× vor, erwartet genau 1×`)
  }
  return html.replace(pattern, replacement)
}

const metaContent = (html, key, name, value) =>
  replaceOnce(
    html,
    new RegExp(`(<meta ${key}="${name}" content=)"[^"]*"`),
    `$1"${escapeAttr(value)}"`,
    `meta ${name}`
  )

export function buildEnglish(html) {
  let out = html
  out = replaceOnce(out, /<html lang="de"/, '<html lang="en"', '<html lang>')
  out = replaceOnce(out, /<title>[^<]*<\/title>/, `<title>${EN.title}</title>`, '<title>')
  out = metaContent(out, 'name', 'description', EN.description)
  out = replaceOnce(
    out,
    /(<link rel="canonical" href=)"[^"]*"/,
    `$1"${PAGE_URL}?lang=en"`,
    'link canonical'
  )
  out = metaContent(out, 'property', 'og:title', EN.title)
  out = metaContent(out, 'property', 'og:description', EN.ogDescription)
  out = metaContent(out, 'property', 'og:url', `${PAGE_URL}?lang=en`)
  out = metaContent(out, 'property', 'og:locale', 'en_US')
  out = metaContent(out, 'property', 'og:locale:alternate', 'de_DE')
  out = metaContent(out, 'name', 'twitter:title', EN.title)
  out = metaContent(out, 'name', 'twitter:description', EN.twitterDescription)
  // Sichtbarer Inhalt ohne JavaScript: englischer Abschnitt aktiv
  out = replaceOnce(
    out,
    /<div id="content-de" class="lang active"/,
    '<div id="content-de" class="lang"',
    'content-de'
  )
  out = replaceOnce(
    out,
    /<div id="content-en" class="lang"/,
    '<div id="content-en" class="lang active"',
    'content-en'
  )
  return out
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readFileSync(new URL('index.html', ROOT), 'utf-8')
  const expected = buildEnglish(source)
  const target = new URL('index.en.html', ROOT)
  if (process.argv.includes('--check')) {
    let current = ''
    try {
      current = readFileSync(target, 'utf-8')
    } catch {
      // fehlt → veraltet
    }
    if (current !== expected) {
      console.error('index.en.html ist veraltet: node scripts/build-en.mjs ausführen')
      process.exit(1)
    }
    console.log('index.en.html ist aktuell')
  } else {
    writeFileSync(target, expected)
    console.log('index.en.html geschrieben')
  }
}
