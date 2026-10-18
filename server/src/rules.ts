const DAY_MS = 24 * 60 * 60 * 1000;

export function feeBalance(amount: number, payments: number[]) {
  return Math.round((amount - payments.reduce((a, b) => a + b, 0) + Number.EPSILON) * 100) / 100;
}

export function feeStatus(
  balance: number,
  dueDate: Date,
  now = new Date(),
  paid = 0,
  graceDays = 7,
) {
  if (!Number.isInteger(graceDays) || graceDays < 0 || graceDays > 3650) {
    throw new RangeError('Fee overdue grace days must be an integer from 0 to 3650.');
  }

  if (balance <= 0) return 'PAID';
  if (now.getTime() >= dueDate.getTime() + graceDays * DAY_MS) return 'OVERDUE';
  return paid > 0 ? 'PARTIALLY_PAID' : 'DUE';
}

export function validLeaveRange(fromAt: Date, toAt: Date) {
  return Number.isFinite(fromAt.getTime()) && Number.isFinite(toAt.getTime()) && fromAt < toAt;
}
