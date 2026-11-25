import { app, WebContents } from 'electron'
import { DohProviderId, PrivacyConfig } from '../shared/types'

// Curated High-Confidence Advertising Domains (EasyList Core)
export const KNOWN_AD_DOMAINS: string[] = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'adnxs.com',
  'adsrvr.org',
  'advertising.com',
  'taboola.com',
  'outbrain.com',
  'criteo.com',
  'criteo.net',
  'amazon-adsystem.com',
  'moatads.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'casalemedia.com',
  'smartadserver.com',
  'yieldmo.com',
  'teads.tv',
  'adform.net',
  'bidswitch.net',
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'revcontent.com',
  'mgid.com',
  'adroll.com',
  'sharethrough.com',
  'triplelift.com',
  'indexww.com',
  '33across.com',
  'gumgum.com',
  'sovrn.com',
  'lijit.com',
  'Adf.ly',
  'exoclick.com',
  'juicyads.com',
  'trafficjunky.net'
]

// Curated High-Confidence Tracking & Telemetry Domains (EasyPrivacy Core)
export const KNOWN_TRACKER_DOMAINS: string[] = [
  'google-analytics.com',
  'googletagmanager.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'amplitude.com',
  'clarity.ms',
  'fullstory.com',
  'logrocket.com',
  'newrelic.com',
  'nr-data.net',
  'scorecardresearch.com',
  'quantserve.com',
  'chartbeat.com',
  'chartbeat.net',
  'omtrdc.net',
  '2o7.net',
  'demdex.net',
  'everesttech.net',
  'krxd.net',
  'bluekai.com',
  'exelator.com',
  'tapad.com',
  'liveramp.com',
  'rlcdn.com',
  'Appsflyer.com',
  'adjust.com',
  'branch.io',
  'Kochava.com',
  'bugsnag.com',
  'sentry-cdn.com',
  'mouseflow.com',
  'crazyegg.com',
  'luckyorange.com',
  'heap.io',
  'heapanalytics.com',
  'kissmetrics.com',
  'statcounter.com',
  'matomo.cloud'
]

// Known URL Tracking Query Parameters to Strip
export const TRACKING_QUERY_PARAMS = new Set<string>([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'twclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'hsCtaTracking',
  'mkt_tok',
  'vero_id',
  'oly_enc_id',
  'oly_anon_id',
  'rb_clickid',
  's_kwcid',
  'yclid'
])

export function extractHostname(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    return parsed.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function isDomainWhitelisted(pageUrl: string, whitelist: string[]): boolean {
  const host = extractHostname(pageUrl)
  if (!host) return false
  return whitelist.some((w) => {
    const clean = w.toLowerCase().trim().replace(/^www\./, '')
    return host === clean || host.endsWith(`.${clean}`)
  })
}

export function evaluateNetworkRequest(
  requestUrl: string,
  pageUrl: string,
  config: PrivacyConfig
): { blocked: boolean; category?: 'ad' | 'tracker' | 'custom'; rule?: string } {
  if (!requestUrl.startsWith('http')) {
    return { blocked: false }
  }

  // Check per-site whitelist
  if (pageUrl && isDomainWhitelisted(pageUrl, config.whitelistedDomains)) {
    return { blocked: false }
  }

  const reqHost = extractHostname(requestUrl)
  if (!reqHost) return { blocked: false }

  // 1. Check Custom User Filter Rules
  for (const rule of config.customBlockRules) {
    const cleanRule = rule.trim().toLowerCase()
    if (!cleanRule || cleanRule.startsWith('!')) continue
    const token = cleanRule.replace(/^\|\|/, '').replace(/\^.*$/, '')
    if (token && (reqHost === token || reqHost.endsWith(`.${token}`) || requestUrl.toLowerCase().includes(token))) {
      return { blocked: true, category: 'custom', rule: cleanRule }
    }
  }

  // 2. Check Native Ad-Blocker List
  if (config.adBlockEnabled) {
    for (const adDom of KNOWN_AD_DOMAINS) {
      const lower = adDom.toLowerCase()
      if (reqHost === lower || reqHost.endsWith(`.${lower}`)) {
        return { blocked: true, category: 'ad', rule: `||${lower}^` }
      }
    }
  }

  // 3. Check Native Tracker List
  if (config.trackerBlockEnabled) {
    for (const trkDom of KNOWN_TRACKER_DOMAINS) {
      const lower = trkDom.toLowerCase()
      if (reqHost === lower || reqHost.endsWith(`.${lower}`)) {
        return { blocked: true, category: 'tracker', rule: `||${lower}^` }
      }
    }
  }

  return { blocked: false }
}

export function stripUrlTrackingParameters(rawUrl: string): {
  cleanedUrl: string
  removedCount: number
} {
  try {
    const parsed = new URL(rawUrl)
    if (!parsed.search) return { cleanedUrl: rawUrl, removedCount: 0 }

    let removedCount = 0
    const keysToDelete: string[] = []
    parsed.searchParams.forEach((_val, key) => {
      if (TRACKING_QUERY_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        keysToDelete.push(key)
      }
    })

    for (const k of keysToDelete) {
      parsed.searchParams.delete(k)
      removedCount++
    }

    if (removedCount === 0) return { cleanedUrl: rawUrl, removedCount: 0 }
    return { cleanedUrl: parsed.toString(), removedCount }
  } catch {
    return { cleanedUrl: rawUrl, removedCount: 0 }
  }
}

export function applyDnsOverHttpsConfig(provider: DohProviderId): void {
  try {
    switch (provider) {
      case 'cloudflare':
        app.configureHostResolver({
          secureDnsMode: 'secure',
          secureDnsServers: ['https://cloudflare-dns.com/dns-query']
        })
        break
      case 'quad9':
        app.configureHostResolver({
          secureDnsMode: 'secure',
          secureDnsServers: ['https://dns.quad9.net/dns-query']
        })
        break
      case 'mullvad':
        app.configureHostResolver({
          secureDnsMode: 'secure',
          secureDnsServers: ['https://doh.mullvad.net/dns-query']
        })
        break
      case 'system':
      default:
        app.configureHostResolver({
          secureDnsMode: 'automatic'
        })
        break
    }
  } catch (err) {
    console.warn('[PrivacyEngine] Failed to configure DNS-over-HTTPS:', err)
  }
}

export async function injectDomScrubberAndProtections(
  wc: WebContents,
  config: PrivacyConfig,
  restoreElements: boolean
): Promise<number> {
  const currentUrl = wc.getURL()
  if (!currentUrl || !currentUrl.startsWith('http')) return 0
  if (isDomainWhitelisted(currentUrl, config.whitelistedDomains)) return 0

  try {
    // 1. Fingerprinting Protection (Canvas / Hardware Concurrency normalization & GPC property)
    if (config.fingerprintProtection || config.sendDoNotTrack) {
      await wc.executeJavaScript(`
        (function() {
          if (window.__kineticFpProtected) return;
          window.__kineticFpProtected = true;
          try {
            Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: false });
            Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: false });
          } catch (e) {}
        })();
      `)
    }

    // 2. Non-Destructive Website Scrubber with 1-Click Element Restorer
    if (!config.domScrubberEnabled) return 0

    const selectors: string[] = [
      'ins.adsbygoogle',
      '[id^="google_ads_iframe"]',
      '[id^="div-gpt-ad"]',
      '.ad-container',
      '.ad-banner',
      '.advertisement-box',
      '[data-ad-slot]',
      '[data-ad-client]',
      'iframe[src*="doubleclick.net"]',
      'iframe[src*="googlesyndication.com"]'
    ]

    if (config.scrubSponsoredCards) {
      selectors.push(
        '.taboola-widget',
        '.OUTBRAIN',
        '[data-testid="placementTracking"]',
        '[aria-label="Sponsored"]'
      )
    }

    if (config.scrubCookieBanners) {
      selectors.push(
        '#onetrust-banner-sdk',
        '#CybotCookiebotDialog',
        '.cc-window.cc-banner',
        '[id*="cookie-consent-banner"]'
      )
    }

    const selectorListJson = JSON.stringify(selectors)

    const scrubbedCount = await wc.executeJavaScript(`
      (function() {
        const selectors = ${selectorListJson};
        const restore = ${restoreElements ? 'true' : 'false'};

        // If user clicked "Restore Scrubbed Elements", unhide everything tagged by Kinetic
        if (restore) {
          const restoredNodes = document.querySelectorAll('[data-kinetic-scrubbed="true"]');
          restoredNodes.forEach((el) => {
            el.style.removeProperty('display');
            el.setAttribute('data-kinetic-restored', 'true');
          });
          return 0;
        }

        let count = 0;
        const combined = selectors.join(',');
        if (!combined) return 0;

        const matches = document.querySelectorAll(combined);
        matches.forEach((el) => {
          if (el && el.style) {
            el.setAttribute('data-kinetic-scrubbed', 'true');
            el.removeAttribute('data-kinetic-restored');
            el.style.setProperty('display', 'none', 'important');
            count++;
          }
        });
        return count;
      })();
    `)

    return typeof scrubbedCount === 'number' ? scrubbedCount : 0
  } catch {
    return 0
  }
}