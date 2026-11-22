export const LICENSE_RANK = {
  B1_AUTO: 1,
  B1: 2,
  B2: 3,
  C: 4,
  D: 5,
  E: 6,
  FC: 7
};

export const getLicenseRank = (licenseClass) => {
  if (!licenseClass) return 0;
  return LICENSE_RANK[String(licenseClass).trim().toUpperCase()] ?? 1;
};

export const calculateCompletedYears = (dateStr) => {
  if (!dateStr) return null;
  const from = new Date(dateStr);
  if (Number.isNaN(from.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - from.getFullYear();
  const monthDiff = today.getMonth() - from.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < from.getDate())) {
    years -= 1;
  }
  return years;
};

export const evaluateEligibility = ({ condition, vehicle, dob, licenseClass, licenseIssueDate }) => {
  const minAge = condition?.minAge ?? 21;
  const minDrivingYears = condition?.requireDrivingYears ?? 1;
  let requiredLicense = condition?.requiredLicenseClass || 'B1';
  if (vehicle?.transmission === 'MANUAL' && (requiredLicense === 'B1' || requiredLicense === 'B1_AUTO')) {
    requiredLicense = 'B2';
  }

  const age = calculateCompletedYears(dob);
  const expYears = calculateCompletedYears(licenseIssueDate);
  const userRank = getLicenseRank(licenseClass);
  const reqRank = getLicenseRank(requiredLicense);

  const ageOk = age === null ? null : age >= minAge;
  const expOk = expYears === null ? null : expYears >= minDrivingYears;
  const licenseOk = !licenseClass ? null : userRank >= reqRank;

  const errors = [];
  if (ageOk === false) {
    errors.push(`Chưa đủ độ tuổi tối thiểu (yêu cầu ≥ ${minAge} tuổi, hiện tại ${age} tuổi).`);
  }
  if (expOk === false) {
    errors.push(`Chưa đủ kinh nghiệm lái xe (yêu cầu ≥ ${minDrivingYears} năm từ ngày cấp GPLX, hiện tại ${Math.max(0, expYears)} năm).`);
  }
  if (licenseOk === false) {
    errors.push(`Hạng GPLX chưa đạt (yêu cầu tối thiểu hạng ${requiredLicense}, hiện khai hạng ${licenseClass}).`);
  }

  return {
    minAge,
    minDrivingYears,
    requiredLicense,
    age,
    expYears,
    ageOk,
    expOk,
    licenseOk,
    errors,
    isAllValid: errors.length === 0
  };
};
