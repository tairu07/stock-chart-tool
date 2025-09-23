// 時間関連のユーティリティ関数

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function getBusinessDays(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // 土曜日(6)と日曜日(0)を除く
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

export function getLastBusinessDay(date: Date = new Date()): Date {
  const result = new Date(date);
  
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() - 1);
  }
  
  return result;
}

export function getPeriodStartDate(period: string, endDate: Date = new Date()): Date {
  const start = new Date(endDate);
  
  switch (period) {
    case '1m':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3m':
      start.setMonth(start.getMonth() - 3);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case '3y':
      start.setFullYear(start.getFullYear() - 3);
      break;
    case '5y':
      start.setFullYear(start.getFullYear() - 5);
      break;
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
  
  return start;
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // JST
  
  // 営業日チェック
  if (!isBusinessDay(jstNow)) {
    return false;
  }
  
  const hour = jstNow.getHours();
  const minute = jstNow.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // 前場: 9:00-11:30 (540-690分)
  // 後場: 12:30-15:00 (750-900分)
  return (timeInMinutes >= 540 && timeInMinutes <= 690) ||
         (timeInMinutes >= 750 && timeInMinutes <= 900);
}

export function getNextMarketOpen(): Date {
  const now = new Date();
  const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // JST
  
  let nextOpen = new Date(jstNow);
  nextOpen.setHours(9, 0, 0, 0);
  
  // 今日の9時を過ぎている場合は翌営業日
  if (jstNow.getHours() >= 9) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  // 営業日まで進める
  while (!isBusinessDay(nextOpen)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  // JSTからUTCに変換
  return new Date(nextOpen.getTime() - (9 * 60 * 60 * 1000));
}
