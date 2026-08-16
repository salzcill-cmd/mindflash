const KEY = 'mindflash:streak'

const isoDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!raw) return 0
    const today = isoDate(new Date())
    if (raw.last === today || raw.last === isoDate(new Date(Date.now() - 86400000))) {
      return raw.count
    }
    return 0
  } catch {
    return 0
  }
}

export function registerStudy() {
  const today = isoDate(new Date())
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
  let count = 1
  if (raw && raw.last === today) {
    count = raw.count
  } else if (raw && raw.last === isoDate(new Date(Date.now() - 86400000))) {
    count = raw.count + 1
  }
  localStorage.setItem(KEY, JSON.stringify({ last: today, count }))
  return count
}
