let counter = 0

const pad = (value: number): string => String(value).padStart(2, '0')

/** A slot time unique within this worker, as a datetime-local value. */
export function nextSlot(): string {
  const start = new Date()
  start.setDate(start.getDate() + 2)
  start.setHours(8, 0, 0, 0)
  start.setMinutes(start.getMinutes() + counter * 30)
  counter += 1
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`
}

export function toIso(local: string): string {
  return new Date(local).toISOString()
}

export function clockLabel(local: string): string {
  const date = new Date(local)
  const hours = date.getHours()
  const suffix = hours >= 12 ? 'PM' : 'AM'
  return `${hours % 12 === 0 ? 12 : hours % 12}:${pad(date.getMinutes())} ${suffix}`
}
