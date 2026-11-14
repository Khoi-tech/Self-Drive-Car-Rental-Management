// Shared rental date/time validation utilities (local datetime-local inputs & URL params)

export const getNowLocalInputStr = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const getStartOfCurrentMinute = (date = new Date()) => {
  const d = new Date(date.getTime());
  d.setSeconds(0, 0);
  return d;
};

export const validateRentalDates = (
  startTimeStr,
  endTimeStr,
  { allowBothEmpty = false, minHours = 4 } = {}
) => {
  const hasStart = Boolean(startTimeStr && String(startTimeStr).trim());
  const hasEnd = Boolean(endTimeStr && String(endTimeStr).trim());

  if (allowBothEmpty && !hasStart && !hasEnd) {
    return { valid: true, error: null, startError: null, endError: null };
  }

  let startError = null;
  let endError = null;
  const nowMin = getStartOfCurrentMinute();

  let start = null;
  if (!hasStart) {
    startError = 'Vui lòng chọn thời gian nhận xe.';
  } else {
    start = new Date(startTimeStr);
    if (isNaN(start.getTime())) {
      startError = 'Thời gian nhận xe không hợp lệ.';
    } else if (start.getTime() < nowMin.getTime()) {
      startError = 'Thời gian nhận xe không được nằm trong quá khứ.';
    }
  }

  let end = null;
  if (!hasEnd) {
    endError = 'Vui lòng chọn thời gian trả xe.';
  } else {
    end = new Date(endTimeStr);
    if (isNaN(end.getTime())) {
      endError = 'Thời gian trả xe không hợp lệ.';
    } else if (end.getTime() < nowMin.getTime()) {
      endError = 'Thời gian trả xe không được nằm trong quá khứ.';
    } else if (start && !isNaN(start.getTime())) {
      if (end.getTime() <= start.getTime()) {
        endError = 'Thời gian trả xe phải sau thời gian nhận xe.';
      } else {
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (diffHours < minHours) {
          endError = `Thời gian thuê xe tối thiểu là ${minHours} giờ.`;
        }
      }
    }
  }

  const error = startError || endError || null;
  return {
    valid: !error,
    error,
    startError,
    endError
  };
};

