// Vietnam Province API v2 client-side utility
const BASE_URL = 'https://provinces.open-api.vn/api/v2';

export async function fetchProvinces() {
  const res = await fetch(`${BASE_URL}/p/`);
  if (!res.ok) throw new Error(`Failed to load provinces: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchWards(provinceCode) {
  if (!provinceCode) return [];
  const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
  if (!res.ok) throw new Error(`Failed to load wards: ${res.status}`);
  const data = await res.json();
  const wards = [];
  if (Array.isArray(data?.districts)) {
    data.districts.forEach(d => {
      if (Array.isArray(d.wards)) wards.push(...d.wards);
    });
  }
  if (wards.length === 0 && Array.isArray(data?.wards)) {
    wards.push(...data.wards);
  }
  return wards;
}

export function formatProvinceName(province) {
  return province?.name || '';
}

export function formatWardName(ward) {
  return ward?.name || '';
}

export function composeFullAddress({ detail, ward, province }) {
  return [detail, formatWardName(ward), formatProvinceName(province)].filter(Boolean).join(', ');
}

export default {
  fetchProvinces,
  fetchWards,
  formatProvinceName,
  formatWardName,
  composeFullAddress,
};
